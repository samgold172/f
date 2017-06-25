'use strict';

import cheerio from 'cheerio';
import moment from 'moment';
import needle from 'needle';
import Horseman from 'node-horseman';
import { eventModel } from './main.models';

let horseman = new Horseman();
const supportedCategories = ['баскетбол', 'бейсбол', 'бокс', 'волейбол', 'гандбол', 'теннис', 'футбол', 'хоккей', 'mma'];
const mmaCategories = ['смешанные единоборства', 'смешанные боевые искуства', 'bellator', 'cage warriors fighting championship', 'ufc'];

export const parser = {
	parse() {
		return Promise.all([
			this.bookmakers.parimatch.parse(),
			this.bookmakers.fonbet.parse()
		]);
	},
	bookmakers: {
		parimatch: {
			name: 'PariMatch',
			url: {
				base: 'https://www.parimatch.com',
				line: 'https://www.parimatch.com/bet.html?hd='
			},
			dateFormat: 'DD/MM/YYYY HH:mm',
			features: {
				cellPositions: {
					default: {
						date: 1,
						teams: 2,
						win: {
							team1: 8,
							draw: 9,
							team2: 10
						}
					},
					'бейсбол': {
						win: {
							team1: 8,
							team2: 9
						}
					},
					'бокс': {
						win: {
							team1: 3,
							draw: 4,
							team2: 5
						}
					},
					'волейбол': {
						win: {
							team1: 8,
							team2: 9
						}
					},
					'смешанные боевые искуства': {
						win: {
							team1: 3,
							team2: 4
						}
					},
					'теннис': {
						win: {
							team1: 8,
							team2: 9
						}
					},
					'bellator': {
						win: {
							team1: 3,
							team2: 4
						}
					},
					'cage warriors fighting championship': {
						win: {
							team1: 3,
							team2: 4
						}
					},
					'ufc': {
						win: {
							team1: 3,
							team2: 4
						}
					}
				}
			},
			parse() {
				const p = getPage(this.url.base)
				.then(html => {
					const $ = cheerio.load(html);
					const cats = $('#lobbySportsHolder ul.groups a').toArray();

					let url = this.url.line;

					cats.forEach(cat => {
						const hd = $(cat).attr('hd');
						url = `${url}${hd},`
					});

					return getPage(url)
				})
				.then(html => {
					const categories = {};
					const self = this;
					const year = '2017';
					const defaultPositions = this.features.cellPositions.default;
					const $ = cheerio.load(html);
					const blocks = $('#f1 > .container').toArray();

					blocks.forEach(b => {
						const catFullName = $(b).find('h3').text();
						const rows = $(b).find('.dt.twp .row1 tr.bk, .dt.twp .row2 tr.bk').toArray();
						const catNameEndIndex = catFullName.search(/\./);

						let catName = catFullName.substring(0, catNameEndIndex).toLowerCase().trim();

						if (mmaCategories.indexOf(catName) != -1) {
							catName = 'mma';
						}

						if (supportedCategories.indexOf(catName) == -1 || catFullName.search(/итоги|статистика матчей|победитель/ig) != -1) {
							return;
						}

						if (!categories[catName]) {
							categories[catName] = [];
						}

						const events = categories[catName];
						const specificPositions = this.features.cellPositions[catName] || {};

						rows.forEach(row => {
							try {
								const $cells = $(row).find('td');
								const event = {};
								const cp = {};

								({
									date: cp.date = defaultPositions.date,
									teams: cp.teams = defaultPositions.teams,
									win: cp.win = defaultPositions.win
								} = specificPositions);

								const dateString = $cells.eq(cp.date).html().split('<br>');
								const dateTime = {
									date: dateString[0],
									time: dateString[1]
								};
								const teams = ($cells.eq(cp.teams)[0].children.length == 3) ? $cells.eq(cp.teams)[0].children : $cells.eq(cp.teams).find('a')[0].children;

								event.date = moment(`${dateTime.date}/${year} ${dateTime.time}`, self.dateFormat);
								event.team1 = teams[0].data;
								event.team2 = teams[2].data;
								event.win = {
									team1: $cells.eq(cp.win.team1).find('a').text(),
									team2: $cells.eq(cp.win.team2).find('a').text(),
									draw: cp.win.draw ? $cells.eq(cp.win.draw).find('a').text() : null
								};

								events.push(eventModel.get(event, this.name));
							} catch (err) {
								// console.log('Parse error: ', err);
							}
						});
					});

					return categories;
				})
				.catch(err => {
					console.log(err);
				});

				return p;
			}
		},
		fonbet: {
			name: 'FonBet',
			url: {
				base: 'https://www.fonbet.com',
				line: 'https://www.fonbet.com/bets/?locale=ru'
			},
			date: {
				format: 'YYYY-MM-DD HH:mm',
				year: '2017'
			},
			parse() {
				const categories = {};
				const p = horseman
				.userAgent('Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0')
				.open(this.url.line)
				.waitFor(function(selector, count) {
					return $(selector).length >= count;
				}, '.lineTable > tbody > tr', 1, true)
				.html('html')
				.then(html => {
					const $ = cheerio.load(html);
					const rows = $('.lineTable > tbody > tr.trSegment, .lineTable > tbody > tr.trEvent').toArray();
					let currentCategory;

					rows.forEach(row => {
						const event = {};
						const $row = $(row);

						try {
							if ($row.css('display') == 'none') {
								return;
							}
							else if ($row.hasClass('trSegment')) {
								const catFullName = $row.find('.lineSegmentFlag').text();
								const catNameEndIndex = catFullName.search(/\./);
								let catName = catFullName.substring(0, catNameEndIndex).toLowerCase().trim();

								if (mmaCategories.indexOf(catName) != -1) {
									catName = 'mma';
								}

								if (supportedCategories.indexOf(catName) == -1 || catFullName.search(/итоги/i) != -1) {
									currentCategory = null;
									return;
								}

								if (!categories[catName]) {
									categories[catName] = []
								}

								currentCategory = categories[catName];
							}
							else if (currentCategory) {
								const eventName = $row.find('.event')[0].children[1].data;
								const teams = eventName.split(' — ');
								const $td = $row.find('td');

								event.team1 = teams[0];
								event.team2 = teams[1];
								event.date = this.getDate($row.find('.eventTime').text());
								event.win = {
									team1: $td.eq(3).text(),
									team2: $td.eq(5).text(),
									draw: $td.eq(4).text()
								};

								currentCategory.push(eventModel.get(event, this.name));
							}
						} catch(err) {

						}
					});
				})
				.close()
				.then(() => {
					return categories;
				})
				.catch(err => {
					console.error(err);

					if (err.message = 'Phantom Process died') {
						horseman.close();
						horseman = new Horseman();
					}

					return {
						bm: 'fonbet',
						message: err.message
					}
				});

				return p;
			},
			getDate(value) {
				const time = value.match(/\d\d:\d\d/)[0];
				const now = moment();
				const year = this.date.year;
				const format = this.date.format;
				let date = null;

				if (value.search(/завтра/i) != -1) {
					date = moment(`${year}-${now.month() + 1}-${now.date() + 1} ${time}`, format);
				}
				else if (value.search(/сегодня/i) != -1) {
					date = moment(`${year}-${now.month() + 1}-${now.date()} ${time}`, format);
				}
				else {
					try {
						const day = value.match(/\d{1,2}\s/)[0].trim();
						const month = value.match(/\s\D+\s/)[0].replace(/[\s в]/g, '');
						date = moment(`${day} ${month} ${year} ${time}`, 'DD MMM YYYY HH:mm', 'ru');
					} catch (err) {
						console.log(err);
					}
				}

				return date;
			}
		},
		'1xbet': {
			dateFormat: 'DD.MM.YYYY HH:mm',
			parse(url) {
				return getPage(url).then(html => {
					const self = this;
					const year = '2017';
					const $ = cheerio.load(html, {normalizeWhitespace: true});
					const rows = $('li.c-events__item div.c-events__item').toArray();
					const events = [];

					rows.forEach(row => {
						try {
							const event = {};
							const dateString = $(row).find('.c-events__time span').text().split(' ');
							const dateTime = {
								date: dateString[0],
								time: dateString[1]
							};
							const teams = $(row).find('.c-events__team');
							const win = $(row).find('.c-bets__item a');

							event.date = moment(`${dateTime.date}.${year} ${dateTime.time}`, self.dateFormat);
							event.team1 = $(teams[0]).text();
							event.team2 = $(teams[1]).text();
							event.win = {
								team1: $(win[0]).text(),
								team2: $(win[1]).text(),
								draw: $(win[2]).text()
							};

							events.push(eventModel.get(event));
						} catch (err) {
							console.log('Parse error: ', err);
						}
					});

					return events;
				});
			}
		}
	}
};

function getPage(url) {
	return new Promise((resolve, reject) => {
		needle.get(url, function(err, res) {
			if (!err && res.statusCode == 200) {
				resolve(res.body);
			} else {
				reject(err);
			}
		});
	});
}