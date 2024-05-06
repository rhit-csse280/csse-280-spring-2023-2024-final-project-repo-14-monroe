/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * monroeds
 */

/** namespace. */
var rhit = rhit || {};


// // main.js
// let data = {
//     name: 'John Doe',
//     age: 30,
//     profession: 'Software Developer'
// };
// module.exports = data;

// // loadCharts.js
// let data = require('./data.js');
// console.log(data);

/** globals */
rhit.FB_COLLECTION_TRADES = "trade";
rhit.FB_KEY_DATE = "date";
rhit.FB_KEY_LAST_TOUCHED = "lastTouched";
rhit.FB_KEY_PRICE = "price";
rhit.FB_KEY_QUANTITY = "quantity";
rhit.FB_KEY_STATUS = "status";
rhit.FB_KEY_TICKER = "ticker";
rhit.FB_KEY_TYPE = "type";
rhit.FB_KEY_USER = "user";
rhit.fbTradesManager = null;
rhit.fbTradeManager = null;
rhit.fbAuthManager = null;


// from https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.HomePageController = class {
	constructor() {
		const date = new Date();
		document.getElementById("dateDisplay").innerHTML = date.toDateString();

		document.querySelector("#importTradesButton").addEventListener("click", (event) => {
			window.location.href = "/trade.html";
		});

		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.FbAuthManager.signOut();
		});

		// document.querySelector("#menuShowMyQuotes").addEventListener("click", (event) => {
		// 	window.location.href = `/list.html?uid=${rhit.fbAuthManager.uid}`;
		// });

		// document.querySelector("#menuSignOut").addEventListener("click", (event) => {
		// 	rhit.fbAuthManager.signOut();
		// });

		// document.querySelector("#submitAddQuote").addEventListener("click", (event) => {
		// 	const quote = document.querySelector("#inputQuote").value;
		// 	const movie = document.querySelector("#inputMovie").value;
		// 	rhit.fbMovieQuotesManager.add(quote, movie);
		// });

		// $("#addQuoteDialog").on("show.bs.modal", (events) => {
		// 	document.querySelector("#inputQuote").value = "";
		// 	document.querySelector("#inputMovie").value = "";
		// });

		// $("#addQuoteDialog").on("shown.bs.modal", (events) => {
		// 	document.querySelector("#inputQuote").focus();

		// });

		// Start listening
		rhit.fbTradesManager.beginListening(this.updateList.bind(this));

	}
	// TODO
	// _createCard(trade) {
	//     var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	//     const daystring = new Date(night.day);
	//     const adjustedDayString = new Date(daystring.getTime() + Math.abs(daystring.getTimezoneOffset() * 60000));
	//     return htmlToElement(`<div class="card">
	//     <div class="card-body">
	//         <div id="cardAlign">
	//             <h5 class="card-title handwrittenB">${weekday[adjustedDayString.getDay()]}, ${daystring.getMonth() + 1}/${adjustedDayString.getDate()}: ${Math.floor(night.duration / 60)} Hrs, ${night.duration % 60} Mins </h5>
	//             <button id="editButton" class="btn" data-toggle="modal" data-target="#editNightDialog"><i
	//                     class="fa-solid fa-pen-to-square" style="font-size: 25px;"></i></button>
	//         </div>
	//     </div>
	// </div>`);
	// }

	updateList() {
		const data = firebase.firestore().collection(rhit.FB_COLLECTION_TRADES);
		let dataArr = [];
		let winCount = 0;
		let lossCount = 0;
		let scratchCount = 0;
		let totalProfit = 0;
		let totalLoss = 0;
		let largestGain = 0;
		let largestLoss = 0;
		let winRate = 0;
		let winLossRatio = 0;
		let averageGainPerTrade = 0;
		let averageLossPerTrade = 0;
		data.get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				let docData = doc.data();
				docData.id = doc.id;
				dataArr.push(docData);
				console.log(`${doc.id} => ${doc.data()}`);
				console.log(doc.data().price);
				console.log(docData.price, docData.quantity);
				let profitLoss = (docData.price - 0) * docData.quantity;
				console.log(profitLoss);
				if (profitLoss > 0) {
					winCount++;
					totalProfit += profitLoss;
					largestGain = Math.max(largestGain, profitLoss);
				} else if (profitLoss < 0) {
					lossCount++;
					totalLoss += profitLoss;
					largestLoss = Math.min(largestLoss, profitLoss);
				}
				else {
					scratchCount++;
				}
				console.log(winCount, lossCount, scratchCount);

			})
			console.log(dataArr);
			console.log(winCount, lossCount, scratchCount);
			winRate = (winCount / (winCount + lossCount + scratchCount)) * 100;
			winLossRatio = winCount / lossCount;
			averageGainPerTrade = totalProfit / winCount;
			averageLossPerTrade = totalLoss / lossCount;
			// populate the table
			document.getElementById('homeWinRate').innerText = winRate.toFixed(2) + '%';
			document.getElementById('homeWinLoss').innerText = winLossRatio.toFixed(2);
			if ((averageGainPerTrade / averageLossPerTrade) >= 0) {
				document.getElementById('homeAverageWinLoss').innerText = '$' + (averageGainPerTrade / averageLossPerTrade).toFixed(2);
			}
			else {
				document.getElementById('homeAverageWinLoss').innerHTML = '-$' + Math.abs((averageGainPerTrade / averageLossPerTrade)).toFixed(2);
			}
			document.getElementById('homeLargestGain').innerText = '$' + largestGain.toFixed(2);
			document.getElementById('homeLargestLoss').innerText = '-$' + Math.abs(largestLoss).toFixed(2);
		});



		const volumeChart = new Chart(
			document.getElementById('volumeChart'),
			{
				type: 'bar',
				options: {
					animation: false,
					plugins: {
						legend: {
							display: false
						},
						tooltip: {
							enabled: true,
							position: 'nearest'
						}
					},
					scales: {
						x: {
							title: {
								display: true,
								text: 'Date'
							}
						},
						y: {
							title: {
								display: true,
								text: 'Volume'
							}
						}
					}
				},
				data: {
					labels: dataArr.map(row => row.date),
					datasets: [
						{
							label: 'Volume by day',
							data: dataArr.map(row => row.quantity)
						}
					]
				}
			}
		);
		// })();

		// (async function () {
		let profitLossData = dataArr;

		// calculate the cumulative P&L
		let cumulativeProfitLoss = 0;
		profitLossData = profitLossData.map(row => {
			cumulativeProfitLoss += (row.price - 0) * row.quantity;
			return { date: row.date, profitLoss: cumulativeProfitLoss };
		});

		// min/max P&L
		const minProfitLoss = Math.min(...profitLossData.map(row => row.profitLoss));
		const maxProfitLoss = Math.max(...profitLossData.map(row => row.profitLoss));

		// create buffer
		const buffer = 0.25;
		const min = Math.min(minProfitLoss - buffer * Math.abs(minProfitLoss), 0);
		const max = maxProfitLoss + buffer * Math.abs(maxProfitLoss);

		const profitLossChart = new Chart(
			document.getElementById('profitLossChart'),
			{
				type: 'line',
				options: {
					animation: false,
					plugins: {
						legend: {
							display: false
						},
						tooltip: {
							enabled: true,
							position: 'nearest'
						}
					},
					scales: {
						x: {
							title: {
								display: true,
								text: 'Date'
							}
						},
						y: {
							title: {
								display: true,
								text: 'Cumulative Profit/Loss'
							},
							min: min,
							max: max
						}
					}
				},
				data: {
					labels: profitLossData.map(row => row.date),
					datasets: [
						{
							label: 'Cumulative Profit/Loss by day',
							data: profitLossData.map(row => row.profitLoss),
							fill: false,
							borderColor: 'rgb(75, 192, 192)',
							tension: 0.5  // set smoothness
						}
					]
				}
			}
		);
		//   })();


		// calculate the win rate
		let winRateData = dataArr;
		let runningWinRate = 0;
		let runningWinCount = 0;
		let runningTradeCount = 0;
		winRateData = winRateData.map(row => {
			if ((row.price - 0) * row.quantity >= 0) {
				runningWinCount++;
				runningTradeCount++;
			}
			else {
				runningTradeCount++;
			}

			return { date: row.date, winRate: (runningWinCount / runningTradeCount) * 100 };
		});

		const winRateChart = new Chart(
			document.getElementById('winRateChart'),
			{
				type: 'line',
				options: {
					animation: false,
					plugins: {
						legend: {
							display: false
						},
						tooltip: {
							enabled: true,
							position: 'nearest'
						}
					},
					scales: {
						x: {
							title: {
								display: true,
								text: 'Date'
							}
						},
						y: {
							title: {
								display: true,
								text: 'Win Rate (%)'
							},
							min: 0,
							suggestedMax: 100
						}
					}
				},
				data: {
					labels: winRateData.map(row => row.date),
					datasets: [
						{
							label: 'Win Rate by day',
							data: winRateData.map(row => row.winRate),
							fill: false,
							borderColor: 'rgb(75, 192, 192)',
							tension: 0.5  // set smoothness
						}
					]
				}
			}
		);

	}

	// updateList() {
	// 	console.log("Update the list on page!");
	// 	console.log(`Num quotes = ${rhit.fbTradesManager.length}`);
	// 	console.log("Example quote = ", rhit.fbTradesManager.getTradeAtIndex(0));

	// 	//make new quoteListContainer
	// 	const newList = htmlToElement('<div id="quoteListContainer"></div>');
	// 	// fill the quoteListContainer with quote cards using a loop
	// 	for (let i = 0; i < rhit.fbTradesManager.length; i++) {
	// 		const mq = rhit.fbTradesManager.getTradeAtIndex(i);
	// 		const newCard = this._createCard(mq);

	// 		newCard.onclick = (event) => {
	// 			//console.log(`You clicked on ${mq.id}`);
	// 			// rhit.storage.setMovieQuoteId(mq.id);



	// 			window.location.href = `/moviequote.html?id=${mq.id}`;

	// 		};

	// 		newList.appendChild(newCard);
	// 	}

	// 	// remove the old quoteListContainer
	// 	// const oldList = document.querySelector("#quoteListContainer");
	// 	// oldList.removeAttribute("id");
	// 	// oldList.hidden = true;
	// 	// put in the new quoteListContainer
	// 	// oldList.parentElement.appendChild(newList);

	// }
}


rhit.Trade = class {
	constructor(date, price, quantity, status, ticker, type, user) {
		console.log("Created FbMovieQuotesManager");
		this.date = date;
		this.price = price;
		this.quantity = quantity;
		this.status = status;
		this.ticker = ticker;
		this.type = type;
		this.user = user;
	}
}

rhit.FbTradesManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_TRADES);
		this._unsubscribe = null;
	}
	add(date, price, quantity, status, ticker, type) {
		this._ref.add({
			[rhit.FB_KEY_DATE]: date,
			[rhit.FB_KEY_PRICE]: price,
			[rhit.FB_KEY_QUANTITY]: quantity,
			[rhit.FB_KEY_STATUS]: status,
			[rhit.FB_KEY_TICKER]: ticker,
			[rhit.FB_KEY_TYPE]: type,
			[rhit.FB_KEY_USER]: rhit.fbAuthManager.uid,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		})
			.then(function (docRef) {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(function (error) {
				console.log("Error adding: ", error);
			})
	}
	beginListening(changeListener) {

		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
		if (this._uid) {
			query = query.where(rhit.FB_KEY_USER, "==", this._uid);
		}

		this._unsubscribe = query
			.onSnapshot((querySnapshot) => {

				this._documentSnapshots = querySnapshot.docs;

				// 	querySnapshot.forEach((doc) => {
				// 		console.log(doc.data());
				// });

				changeListener();
			});

	}
	stopListening() {
		this._unsubscribe();
	}
	// update(id, quote, movie) {    }
	// delete(id) { }
	get length() {
		return this._documentSnapshots.length;
	}
	getTradeAtIndex(index) {
		//date, price, quantity, status, ticker, type, user
		const docSnapshot = this._documentSnapshots[index];
		const trade = new rhit.Trade(
			docSnapshot.date,
			docSnapshot.price,
			docSnapshot.quantity,
			docSnapshot.status,
			docSnapshot.ticker,
			docSnapshot.type,
			docSnapshot.id,
		);
		return trade;
	}
}

rhit.DetailPageController = class {
	constructor() {

		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});


		document.querySelector("#submitEditQuote").addEventListener("click", (event) => {
			const quote = document.querySelector("#inputQuote").value;
			const movie = document.querySelector("#inputMovie").value;
			rhit.fbSingleQuoteManager.update(quote, movie);
		});

		$("#editQuoteDialog").on("show.bs.modal", (events) => {
			document.querySelector("#inputQuote").value = rhit.fbSingleQuoteManager.quote;
			document.querySelector("#inputMovie").value = rhit.fbSingleQuoteManager.movie;
		});

		$("#editQuoteDialog").on("shown.bs.modal", (events) => {
			document.querySelector("#inputQuote").focus();

		});

		document.querySelector("#submitDeleteQuote").addEventListener("click", (event) => {
			rhit.fbSingleQuoteManager.delete().then(() => {
				console.log("Document successfully deleted");
				window.location.href = "/list.html";
			}).catch(function (error) {
				console.log("Error deleting document: ", error);
			});
		});

		rhit.fbSingleQuoteManager.beginListening(this.updateView.bind(this));
	}
	updateView() {
		document.querySelector("#cardQuote").innerHTML = rhit.fbSingleQuoteManager.quote;
		document.querySelector("#cardMovie").innerHTML = rhit.fbSingleQuoteManager.movie;
		if (rhit.fbSingleQuoteManager.author == rhit.fbAuthManager.uid) {
			document.querySelector("#menuDelete").style.display = "flex";
			document.querySelector("#menuEdit").style.display = "flex";
		}
	}
}

rhit.FbSingleQuoteManager = class {
	constructor(movieQuoteId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_MOVIEQUOTES).doc(movieQuoteId);
		console.log(`Listening to ${this._ref.path}`);
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				console.log("Document data:", doc.data());
				this._documentSnapshot = doc;
				changeListener();
			} else {
				console.log("No such document!");
			}
		})
	}
	stopListening() {
		this._unsubscribe();
	}
	update(quote, movie) {
		this._ref.update({
			[rhit.FB_KEY_QUOTE]: quote,
			[rhit.FB_KEY_MOVIE]: movie,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		})
			.then(() => {
				console.log("Document successfully updated!");
			})
			.catch(function (error) {
				console.log("Error updating document: ", error);
			})
	}
	delete() {
		return this._ref.delete();
	}

	get quote() {
		return this._documentSnapshot.get(rhit.FB_KEY_QUOTE);
	}

	get movie() {
		return this._documentSnapshot.get(rhit.FB_KEY_MOVIE);
	}

	get author() {
		return this._documentSnapshot.get(rhit.FB_KEY_AUTHOR);
	}
}




// rhit.storage = rhit.storage || {};
// rhit.storage.MOVIEQUOTE_ID_KEY = "movieQuoteId";

// rhit.storage.getMovieQuoteId = function () {
// 	const mqId = sessionStorage.getItem(rhit.storage.MOVIEQUOTE_ID_KEY);
// 	if (!mqId) {
// 		console.log("No movie quote id in sessionStorage!");
// 	}
// 	return mqId;
// };
// rhit.storage.setMovieQuoteId = function (movieQuoteId) {
// 	sessionStorage.setItem(rhit.storage.MOVIEQUOTE_ID_KEY, movieQuoteId);
// };


rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#roseFireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		}
	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}
	signIn() {
		console.log("Sign in");
		Rosefire.signIn("b220b6db-9361-4c18-bbd7-3500677731a7", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			console.log("Rosefire success!", rfUser);


			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token') {
					alert('The token you provided is not valid.');
				} else {
					console.error("Custom auth login error", errorCode, errorMessage);
				}
			});

		});

	}
	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}

}





rhit.checkForRedirects = function () {
	// if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
	// 	window.location.href = "/list.html";
	// }
	// if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
	// 	window.location.href = "/";
	// }
}

rhit.initializePage = function () {
	if (document.querySelector("#homePage")) {
		console.log("On home page");

		const urlParams = new URLSearchParams(window.location.search);
		const uid = urlParams.get("uid");
		console.log("uid = ", uid);
		rhit.fbTradesManager = new rhit.FbTradesManager(uid);
		new rhit.HomePageController();

	}

	if (document.querySelector("#detailPage")) {
		console.log("On detail page");
		const urlParams = new URLSearchParams(window.location.search);
		const movieQuoteId = urlParams.get("id");

		if (!movieQuoteId) {
			window.location.href = "/";
		}

		rhit.fbSingleQuoteManager = new rhit.FbSingleQuoteManager(movieQuoteId);
		new rhit.DetailPageController();

	}

	if (document.querySelector("#loginPage")) {
		console.log("On login page");
		new rhit.LoginPageController();
	}
}

/* Main */
/** function and class syntax examples */
rhit.main = function () {
	console.log("Ready");
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("Auth state changed");
		if (rhit.fbAuthManager.isSignedIn) {
			console.log("User is signed in");
		} else {
			console.log("User is signed out");
		}

		// redirects
		rhit.checkForRedirects();
		// initialization
		rhit.initializePage();
	});



	// temp code for Read and Add
	// const ref = firebase.firestore().collection("MovieQuotes");
	// ref.onSnapshot((querySnapshot) => {
	// 	querySnapshot.forEach((doc) => {
	// 		console.log(doc.data());
	// 	});
	// });

	// ref.add({
	// 	quote: "My first test",
	// 	movie: "My first movie"
	// });

};

rhit.main();
