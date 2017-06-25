'use strict';

export const eventModel = {
	get({date, team1 = '', team2 = '', win}, bm) {
		return {
			bm: bm,
			team1: team1.toLowerCase().replace(/u[-\s](\d)(\d)/ig, 'u$1$2').trim(),
			team2: team2.toLowerCase().replace(/u[-\s](\d)(\d)/ig, 'u$1$2').trim(),
			bets: {
				win: {
					team1: Number(win.team1),
					team2: Number(win.team2),
					draw: Number(win.draw)
				}
			}
		}
	}
};

