/**
 * @fileoverview
 * Provides the JavaScript interactions for all pages.
 *
 * @author 
 * monroeds
 */

/** namespace. */
var rhit = rhit || {};

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

/** Charts */
let volumeChart = null;
let profitLossChart = null;
let winRateChart = null;

// from https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro/35385518#35385518
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.HomePageController = class {
	constructor() {
		document.querySelector("#importTradesButton").addEventListener("click", (event) => {
			window.location.href = "/trade.html";
		});
		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
		rhit.fbTradesManager.beginListening(this.updateList.bind(this));
	}
	updateList() {
		let dataArr = [];
		let tradeMap = new Map();
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
		let query = rhit.fbTradesManager._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc");
		if (!rhit.fbAuthManager.uid) {
			console.error("uid not set correctly");
		}
		query = query.where(rhit.FB_KEY_USER, "==", rhit.fbAuthManager.uid).get().then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				let docData = doc.data();
				docData.id = doc.id;
				dataArr.push(docData);
			})
			for (let i = 0; i < dataArr.length; i++) {
				if (tradeMap.has(dataArr[i].ticker))
					tradeMap.get(dataArr[i].ticker).push(dataArr[i]);
				else {
					let newArr = [];
					newArr.push(dataArr[i]);
					tradeMap.set(dataArr[i].ticker, newArr);
				}
			}
			for (let ticker of tradeMap.keys()) {
				let profitLoss = 0;
				let flag = 0;
				tradeMap.get(ticker).forEach((trade) => {
					if (trade.status == "inactive") {
						flag = 1;
						if (trade.type == "buy")
							profitLoss -= trade.price * trade.quantity;
						else
							profitLoss += trade.price * trade.quantity;
					}
				});
				if (flag == 1) {
					if (profitLoss > 0) {
						winCount++;
						totalProfit += profitLoss;
						largestGain = Math.max(largestGain, profitLoss);
					} else if (profitLoss < 0) {
						lossCount++;
						totalLoss += profitLoss;
						largestLoss = Math.min(largestLoss, profitLoss);
					}
					else
						scratchCount++;
				}
			}
			winRate = (winCount / (winCount + lossCount + scratchCount)) * 100;
			winLossRatio = winCount / lossCount;
			averageGainPerTrade = totalProfit / winCount;
			averageLossPerTrade = totalLoss / lossCount;
			// populate the table
			document.getElementById('homeWinRate').innerText = winRate.toFixed(2) + '%';
			document.getElementById('homeWinLoss').innerText = winLossRatio.toFixed(2);
			if (Math.abs(averageGainPerTrade / averageLossPerTrade) >= 1)
				document.getElementById('homeAverageWinLoss').innerText = '$' + Math.abs(averageGainPerTrade / averageLossPerTrade).toFixed(2);
			else
				document.getElementById('homeAverageWinLoss').innerHTML = '-$' + Math.abs((averageGainPerTrade / averageLossPerTrade)).toFixed(2);
			document.getElementById('homeLargestGain').innerText = '$' + largestGain.toFixed(2);
			document.getElementById('homeLargestLoss').innerText = '-$' + Math.abs(largestLoss).toFixed(2);
		}).then(() => {
			if (volumeChart)
				volumeChart.destroy();
			if (profitLossChart)
				profitLossChart.destroy();
			if (winRateChart)
				winRateChart.destroy();
			const groupedDataArr = groupByDate(dataArr);
			groupedDataArr.sort((a, b) => new Date(a.date) - new Date(b.date));
			volumeChart = new Chart(
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
						labels: groupedDataArr.map(row => row.date),
						datasets: [
							{
								label: 'Volume by day',
								data: groupedDataArr.map(row => row.quantity)
							}
						]
					}
				}
			);
			// Group the data by date
			let profitLossData = groupByDate(dataArr);
			profitLossData.sort((a, b) => new Date(a.date) - new Date(b.date));
			// Calculate the cumulative P&L for each group
			let cumulativeProfitLoss = 0;
			profitLossData = profitLossData.map((row) => {
				for (let ticker of tradeMap.keys()) {
					let profitLoss = 0;
					tradeMap.get(ticker).forEach((trade) => {
						if (trade.status == "inactive" && new Date(trade.date).getTime() == new Date(row.date).getTime()) {
							if (trade.type == "buy")
								profitLoss -= trade.price * trade.quantity;
							else
								profitLoss += trade.price * trade.quantity;
						}
					});
					cumulativeProfitLoss += profitLoss;
				}
				return { date: row.date, profitLoss: cumulativeProfitLoss };
			});
			// min/max P&L
			const minProfitLoss = Math.min(...profitLossData.map(row => row.profitLoss));
			const maxProfitLoss = Math.max(...profitLossData.map(row => row.profitLoss));
			// create buffer
			const buffer = 0.25;
			const min = Math.min(minProfitLoss - buffer * Math.abs(minProfitLoss), 0);
			const max = maxProfitLoss + buffer * Math.abs(maxProfitLoss);
			profitLossChart = new Chart(
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
			// calculate the win rate
			let winRateData = groupByDate(dataArr);
			winRateData.sort((a, b) => new Date(a.date) - new Date(b.date));
			let runningWinCount = 0;
			let runningTradeCount = 0;
			winRateData = winRateData.map(row => {
				for (let ticker of tradeMap.keys()) {
					let tickerProfitLoss = 0;
					let flag = 0;
					tradeMap.get(ticker).forEach((trade) => {
						if (trade.status == "inactive" && new Date(trade.date).getTime() == new Date(row.date).getTime()) {
							flag = 1;
							if (trade.type == "buy")
								tickerProfitLoss -= trade.price * trade.quantity;
							else
								tickerProfitLoss += trade.price * trade.quantity;
						}
					});
					if (flag) {
						if (tickerProfitLoss >= 0) {
							runningWinCount++;
							runningTradeCount++;
						}
						else
							runningTradeCount++;
					}
				}
				return { date: row.date, winRate: (runningWinCount / runningTradeCount) * 100 };
			});
			winRateChart = new Chart(
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
		});
	}
}

function groupByDate(dataArr) {
	const groupedData = dataArr.reduce((acc, row) => {
		acc[row.date] = (acc[row.date] || 0) + Number(row.quantity);
		return acc;
	}, {});

	return Object.entries(groupedData).map(([date, quantity]) => ({ date, quantity }));
}

rhit.Trade = class {
	constructor(id, date, price, quantity, status, ticker, type, user) {
		this.id = id,
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
	addSampleData() {
		this.add("2024-04-23", "128.84", "843", "inactive", "AMZN", "buy");
		this.add("2024-04-23", "319.23", "843", "inactive", "AMZN", "sell");
		this.add("2024-03-26", "829.00", "500", "inactive", "TSLA", "buy");
		this.add("2024-03-26", "1776.00", "500", "inactive", "TSLA", "sell");
		this.add("2024-05-08", "192.00", "922", "inactive", "SNAP", "buy");
		this.add("2024-05-08", "46.29", "922", "inactive", "SNAP", "sell");
	}
	beginListening(changeListener) {
		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc").limit(50);
		if (this._uid)
			query = query.where(rhit.FB_KEY_USER, "==", this._uid);
		this._unsubscribe = query
			.onSnapshot((querySnapshot) => {
				this._documentSnapshots = querySnapshot.docs;
				changeListener();
			});
	}
	stopListening = () => this._unsubscribe;
	get length() {
		return this._documentSnapshots.length;
	}
	getTradeAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const trade = new rhit.Trade(
			docSnapshot.id,
			docSnapshot.data().date,
			docSnapshot.data().price,
			docSnapshot.data().quantity,
			docSnapshot.data().status,
			docSnapshot.data().ticker,
			docSnapshot.data().type,
			docSnapshot.data().user,
		);
		return trade;
	}
}

rhit.TradePageController = class {
	constructor() {
		document.getElementById('openAddModal').addEventListener('click', function () {
			document.getElementById('addModal').classList.remove('hidden');
		});
		document.getElementById('addSampleData').addEventListener('click', function () {
			rhit.fbTradesManager.addSampleData();
		});
		document.getElementById('closeDiscardAddModal').addEventListener('click', function () {
			document.getElementById('addModal').classList.add('hidden');
			document.querySelector("#inputDate").value = "";
			document.querySelector("#inputPrice").value = "";
			document.querySelector("#inputQuantity").value = "";
			document.querySelector("#inputStatus").value = "";
			document.querySelector("#inputTicker").value = "";
			document.querySelector("#inputType").value = "";
		});
		document.getElementById('closeSubmitAddModal').addEventListener('click', function () {
			const date = document.querySelector("#inputDate").value;
			const price = document.querySelector("#inputPrice").value;
			const quantity = document.querySelector("#inputQuantity").value;
			const status = document.querySelector("#inputStatus").value;
			const ticker = document.querySelector("#inputTicker").value;
			const type = document.querySelector("#inputType").value;
			rhit.fbTradesManager.add(date, price, quantity, status, ticker, type);
			document.getElementById('addModal').classList.add('hidden');
			document.querySelector("#inputDate").value = "";
			document.querySelector("#inputPrice").value = "";
			document.querySelector("#inputQuantity").value = "";
			document.querySelector("#inputStatus").value = "";
			document.querySelector("#inputTicker").value = "";
			document.querySelector("#inputType").value = "";
		});
		document.getElementById('closeSubmitEditModal').addEventListener('click', function () {
			const date = document.querySelector("#editDate").value;
			const price = document.querySelector("#editPrice").value;
			const quantity = document.querySelector("#editQuantity").value;
			const status = document.querySelector("#editStatus").value;
			const ticker = document.querySelector("#editTicker").value;
			const type = document.querySelector("#editType").value;
			rhit.fbTradeManager.update(date, price, quantity, status, ticker, type);
			document.getElementById('editModal').classList.add('hidden');
			document.querySelector("#inputDate").value = "";
			document.querySelector("#inputPrice").value = "";
			document.querySelector("#inputQuantity").value = "";
			document.querySelector("#inputStatus").value = "";
			document.querySelector("#inputTicker").value = "";
			document.querySelector("#inputType").value = "";
		});
		document.getElementById('closeDiscardEditModal').addEventListener('click', function () {
			document.getElementById('editModal').classList.add('hidden');
			document.querySelector("#editDate").value = "";
			document.querySelector("#editPrice").value = "";
			document.querySelector("#editQuantity").value = "";
			document.querySelector("#editStatus").value = "";
			document.querySelector("#editTicker").value = "";
			document.querySelector("#editType").value = "";
		});
		document.getElementById('closeSubmitDeleteModal').addEventListener('click', function () {
			console.log(rhit.fbTradeManager);
			rhit.fbTradeManager.delete();
			document.getElementById('deleteModal').classList.add('hidden');
		});
		document.getElementById('closeDiscardDeleteModal').addEventListener('click', function () {
			document.getElementById('deleteModal').classList.add('hidden');
		});
		rhit.fbTradesManager.beginListening(this.updateList.bind(this), document);
	}

	_createCard(trade, index) {
		const card = htmlToElement(`<tr class="hover:bg-gray-100">
			<td class="p-4">
		</td>
		<td class="p-4 text-xl">${trade.ticker}</td>
		<td class="p-4 text-xl">${trade.date}</td>
		<td class="p-4 text-xl">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${trade.type}</td>
		<td class="p-4 text-xl">${trade.price} USD</td>
		<td class="p-4 text-xl">${trade.quantity}</td>
		<td class="p-4 text-xl">${trade.status}</td>
		<td class="p-4 flex justify-end">
			<button id="edit${index}" class="mr-2 p-1 text-xs font-medium text-white bg-blue-500 rounded-lg"><svg
					xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
					class="bi bi-pencil-fill" viewBox="0 0 16 16">
					<path
						d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.5.5 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11z" />
				</svg></button>
			<button id="delete${index}" class="p-1 text-xs font-medium text-white bg-red-500 rounded-lg"><svg
					xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
					class="bi bi-trash3-fill" viewBox="0 0 16 16">
					<path
						d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
				</svg></button>
		</td>
	</tr>`);
		// Attach the event listeners
		card.querySelector(`#edit${index}`).onclick = (event) => {
			document.getElementById('editModal').classList.remove('hidden');
			document.querySelector("#editDate").value = trade.date;
			document.querySelector("#editPrice").value = trade.price;
			document.querySelector("#editQuantity").value = trade.quantity;
			document.querySelector("#editStatus").value = trade.status;
			document.querySelector("#editTicker").value = trade.ticker;
			document.querySelector("#editType").value = trade.type;
			rhit.fbTradeManager = new rhit.FbTradeManager(trade.id);
		};
		card.querySelector(`#delete${index}`).onclick = (event) => {
			document.getElementById('deleteModal').classList.remove('hidden');
			rhit.fbTradeManager = new rhit.FbTradeManager(trade.id);
		};
		return card;
	}
	updateList() {
		const newList = htmlToElement('<tbody id="tradeListContainer"></tbody>');
		for (let i = 0; i < rhit.fbTradesManager.length; i++) {
			const t = rhit.fbTradesManager.getTradeAtIndex(i);
			const newCard = this._createCard(t, i);
			newList.appendChild(newCard);
		}
		// remove the old tradeListContainer
		const oldList = document.querySelector("#tradeListContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		// put in the new tradeListContainer
		oldList.parentElement.appendChild(newList);
	}
}

rhit.FbTradeManager = class {
	constructor(tradeId) {
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_TRADES).doc(tradeId);
	}
	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			if (doc.exists) {
				this._documentSnapshot = doc;
				changeListener();
			} else
				console.log("No such document!");
		})
	}
	stopListening = () => this._unsubscribe;
	update(date, price, quantity, status, ticker, type) {
		this._ref.update({
			[rhit.FB_KEY_DATE]: date,
			[rhit.FB_KEY_PRICE]: price,
			[rhit.FB_KEY_QUANTITY]: quantity,
			[rhit.FB_KEY_STATUS]: status,
			[rhit.FB_KEY_TICKER]: ticker,
			[rhit.FB_KEY_TYPE]: type,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		})
			.then(() => console.log("Document successfully updated!"))
			.catch((error) => console.log("Error updating document: ", error))
	}
	delete() {
		return this._ref.delete();
	}
	get date() {
		return this._documentSnapshot.get(rhit.FB_KEY_DATE);
	}
	get price() {
		return this._documentSnapshot.get(rhit.FB_KEY_PRICE);
	}
	get quantity() {
		return this._documentSnapshot.get(rhit.FB_KEY_QUANTITY);
	}
	get status() {
		return this._documentSnapshot.get(rhit.FB_KEY_STATUS);
	}
	get ticker() {
		return this._documentSnapshot.get(rhit.FB_KEY_TICKER);
	}
	get type() {
		return this._documentSnapshot.get(rhit.FB_KEY_TYPE);
	}
	get user() {
		return this._documentSnapshot.get(rhit.FB_KEY_USER);
	}
}

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
		Rosefire.signIn("2922a2bc-412b-424d-8c70-d2b0f6745cde", (err, rfUser) => {
			if (err) {
				console.log("Rosefire error!", err);
				return;
			}
			firebase.auth().signInWithCustomToken(rfUser.token).catch((error) => {
				const errorCode = error.code;
				const errorMessage = error.message;
				if (errorCode === 'auth/invalid-custom-token')
					alert('The token you provided is not valid.');
				else
					console.error("Custom auth login error", errorCode, errorMessage);
			});
		});
	}
	signOut() {
		firebase.auth().signOut().catch((error) => console.log("Sign out error", error));
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginBody") && rhit.fbAuthManager.isSignedIn)
		window.location.href = `/index.html`;
	else if (!document.querySelector("#loginBody") && !rhit.fbAuthManager.isSignedIn)
		window.location.href = "/login.html";
}

rhit.initializePage = function () {
	if (document.querySelector("#homePage")) {
		rhit.fbTradesManager = new rhit.FbTradesManager(rhit.fbAuthManager.uid);
		new rhit.HomePageController();
	}
	if (document.querySelector("#tradePage")) {
		rhit.fbTradesManager = new rhit.FbTradesManager(rhit.fbAuthManager.uid);
		new rhit.TradePageController();
	}
	if (document.querySelector("#loginBody"))
		new rhit.LoginPageController();
}

rhit.main = function () {
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		rhit.checkForRedirects();
		rhit.initializePage();
	});
};

rhit.main();