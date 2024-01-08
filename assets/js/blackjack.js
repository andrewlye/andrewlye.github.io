var dealerSum;
var dealerVisibleSum;
var playerSum;

var dealerAceCount;
var playerAceCount;

var new_player_cards;
var new_dealer_cards;
var new_player_sum;
var new_dealer_sum;
var new_hidden;
var new_results; 

var hidden;
var deck;
var q_table;

var canHit;

window.onload = function() {
  new_player_cards = document.getElementById("player-cards").innerHTML;
  new_dealer_cards = document.getElementById("dealer-cards").innerHTML;
  new_player_sum = document.getElementById("player-sum").innerHTML;
  new_dealer_sum = document.getElementById("dealer-sum").innerHTML;
  new_hidden = document.getElementById("hidden").innerHTML;
  new_results = document.getElementById("results").innerHTML; 
  init();
}

function init() {
  dealerSum = 0;
  dealerVisibleSum = 0;
  playerSum = 0;
  dealerAceCount = 0;
  playerAceCount = 0;
  canHit = true;

  selectAgent();
  buildDeck();
  shuffleDeck();
  startGame();
}

async function selectAgent(){
  const res = await fetch('./assets/js/agents/default_agent.json')
  q_table = await res.json();
  console.log(q_table);
}

async function buildDeck() {
  let values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
  let types = ["C", "D", "H", "S"]
  deck = [];

  for (let i=0; i < types.length; i++){
    for (let j=0; j < values.length; j++){
      deck.push(values[j] + "-" + types[i]);
    }
  }
}

function shuffleDeck() {
  // Fisher-Yates Shuffling
  for(let i = deck.length-1; i >= 0; i--){
    let j = Math.floor(Math.random() * (i+1));
    let temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
}

async function startGame() {
  hidden = draw();
  dealerSum += getValue(hidden);
  dealerAceCount += checkAce(hidden);
  
  let cardImg = document.createElement("img");
  await delay(1000);
  let card = draw();
  cardImg.src = "./assets/images/cards/" + card + ".png";
  dealerSum += getValue(card);
  dealerVisibleSum = getValue(card);
  dealerAceCount += checkAce(card);
  document.getElementById("dealer-cards").append(cardImg);

  console.log(dealerSum);

  for (let i=0; i < 2; i++){
    await delay(1000);
    let cardImg = document.createElement("img");
    let card = draw();
    cardImg.src = "./assets/images/cards/" + card + ".png";
    playerSum += getValue(card);
    playerAceCount += checkAce(card);
    document.getElementById("player-cards").append(cardImg);
  }
  console.log(playerSum);

  while(canHit){
    let move = await getAction();
    if (move == 1) {
      await delay(1000);
      hit();
    }
    else break;
  }

  await delay(1000);
  stay();

}

async function getAction() {
  var hasAce = (playerAceCount > 0) ? 1 : 0;
  var state_obs = "" + playerSum + "," + dealerVisibleSum + "," + hasAce;
  var action_space = q_table[state_obs];

  if (typeof action_space == "undefined") {
    console.log("Random Action");
    var rand = (Math.random() >= 0.5) ? 1 : 0;
    return rand;
  }
  else{
    console.log(action_space);
    var action = (action_space[0] > action_space[1]) ? 0 : 1;
    console.log(action);
    return action
  }
}

function hit() {
  if (!canHit){
    return;
  }
  let cardImg = document.createElement("img");
  let card = draw();
  cardImg.src = "./assets/images/cards/" + card + ".png";
  playerSum += getValue(card);
  playerAceCount += checkAce(card);
  document.getElementById("player-cards").append(cardImg);
  if (reduceAce(playerSum, playerAceCount) > 21){
    canHit = false;
  }
  console.log(playerSum);
}

async function stay() {
  document.getElementById("hidden").src = "./assets/images/cards/" + hidden + ".png";
  while (dealerSum < 17) {
    await delay(1000);
    let cardImg = document.createElement("img");
    let card = draw();
    cardImg.src = "./assets/images/cards/" + card + ".png";
    dealerSum += getValue(card);
    dealerAceCount += checkAce(card);
    document.getElementById("dealer-cards").append(cardImg);
  }

  console.log(dealerSum);
  dealerSum = reduceAce(dealerSum, dealerAceCount);
  playerSum = reduceAce(playerSum, playerAceCount);
  canHit = false;

  let message = "";
  if (playerSum > 21) {
    message = "House Wins!"
  }
  else if (dealerSum > 21) {
    message = "Player Wins!"
  }
  else if (playerSum == dealerSum) {
    message = "Tie!"
  }
  else if (playerSum > dealerSum) {
    message = "Player Wins!"
  }
  else if (playerSum < dealerSum) {
    message = "House Wins!"
  }

  await delay(1000);
  document.getElementById("dealer-sum").innerText = dealerSum
  document.getElementById("player-sum").innerText = playerSum
  document.getElementById("results").innerText = message;

  await delay(5000);
  document.getElementById("player-cards").innerHTML = new_player_cards;
  document.getElementById("dealer-cards").innerHTML = new_dealer_cards;
  document.getElementById("player-sum").innerHTML = new_player_sum;
  document.getElementById("dealer-sum").innerHTML = new_dealer_sum;
  document.getElementById("hidden").innerHTML = new_hidden;
  document.getElementById("results").innerHTML = new_results;

  init()
}

function draw() {
  let i = Math.floor(Math.random() * deck.length)
  return deck[i];
}

function getValue(card) {
  let data = card.split("-");
  let value = data[0];

  if (isNaN(value)){
    if (value == "A"){
      return 11;
    }
    return 10;
  }
  
  return parseInt(value);
}

function reduceAce(playerSum, playerAceCount){
  while(playerSum > 21 && playerAceCount > 0){
    playerSum -= 10;
    playerAceCount -= 1;
  }

  return playerSum;
}

function checkAce(card) {
  if (card[0] == "A") {
    return 1;
  }
  return 0;
}

function delay(milliseconds){
      return new Promise(resolve => {
            setTimeout(resolve, milliseconds);
        });
}
