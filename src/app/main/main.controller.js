'use strict';

import { parser } from './parser';

export const mainCtrl = {
	get(req, res) {
		res.render('index', {
			title: 'Fork finder'
		});
	},

	calculate(req, res) {
		parser.parse()
		.then(results => {
			const matchedEvents = {};

			results.forEach((bm, i) => {
				const nextBm = results[i + 1];

				if (!nextBm) {
					return;
				}

				for (let category in bm) {
					if (!bm.hasOwnProperty(category) || !nextBm.hasOwnProperty(category)) {
						continue;
					}

					bm[category].forEach(bmEvent => {
						nextBm[category].some(nextBmEvent => {
							if ((compareNames(bmEvent.team1, nextBmEvent.team1) && compareNames(bmEvent.team2, nextBmEvent.team2)) ||
								(compareNames(bmEvent.team1, nextBmEvent.team2) && compareNames(bmEvent.team2, nextBmEvent.team1))) {

								if (!compareNames(bmEvent.team1, nextBmEvent.team1) && compareNames(bmEvent.team1, nextBmEvent.team2)) {
									let team1, winTeam1;

									team1 = nextBmEvent.team2;
									winTeam1 = nextBmEvent.bets.win.team2;

									nextBmEvent.team2 = nextBmEvent.team1;
									nextBmEvent.team1 = team1;
									nextBmEvent.bets.win.team2 = nextBmEvent.bets.win.team1;
									nextBmEvent.bets.win.team1 = winTeam1;
								}

								if (!matchedEvents[category]) {
									matchedEvents[category] = [];
								}

								matchedEvents[category].push([bmEvent, nextBmEvent]);

								return true;
							}
						})
					});
				}
			});

			const forks = findForks(matchedEvents);

			debugger;
		})
		.catch(err => {
			console.log(err);
		});
	}
};

function findForks(matchedEvents) {
	const forks = {};

	for (let category in matchedEvents) {
		matchedEvents[category].forEach(event => {
			const team1Win = event[0].bets.win;
			const team2Win = event[1].bets.win;
			const maxValues = {
				team1: team1Win.team1 > team2Win.team1 ? team1Win.team1 : team2Win.team1,
				team2: team1Win.team2 > team2Win.team2 ? team1Win.team2 : team2Win.team2,
				draw: team1Win.draw > team2Win.draw ? team1Win.draw : team2Win.draw
			};
			let inversionTotal;

			if (!maxValues.team1 || !maxValues.team2) {
				return;
			}

			if (!maxValues.draw) {
				maxValues.draw = 1;
			}

			inversionTotal = 1/maxValues.team1 + 1/maxValues.team2 + 1/maxValues.draw;

			if (inversionTotal < 1) {
				if (!forks[category]) {
					forks[category] = [];
				}

				forks[category].push([event[0], event[1]]);
			}
		});
	}

	return forks;
}


function compareNames(name1, name2) {
	if (name1.search(/u\d\d|\(/g) != -1 || name2.search(/u\d\d|\(/g) != -1) {
		return name1 == name2;
	}
	else {
		const name1Arr = name1.split(' ');
		const name2Arr = name2.split(' ');

		return name1Arr.some(namePart => {
			return namePart.search(/u\d\d|\(/g) == -1 && name2Arr.indexOf(namePart) != -1;
		});
	}
}