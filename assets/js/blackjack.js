var dealerSum;
var dealerVisibleSum;
var playerSum;

var dealerAceCount;
var playerAceCount;

var new_player_cards;
var new_dealer_cards;
var new_player_action;
var new_results;

var hidden;
var deck;
var q_table;

var imgs = {};

var canHit;
var bust;

var intelligence;

window.onload = function() {
  new_player_cards = ""; 
  new_dealer_cards = ""; 
  new_results = ""; 
  new_player_action = ""; 

  buildDeck();
  init(2);
}

function init(int_level) {
  document.getElementById("player-cards").innerHTML = new_player_cards;
  document.getElementById("dealer-cards").innerHTML = new_dealer_cards;
  document.getElementById("results").innerHTML = new_results;
  document.getElementById("player-action").innerHTML = new_player_action;

  dealerSum = 0;
  dealerVisibleSum = 0;
  playerSum = 0;
  dealerAceCount = 0;
  playerAceCount = 0;
  canHit = true;
  bust = false;
  intelligence = int_level;

  document.getElementById("intelligence").innerText = intelligence;

  selectAgent(intelligence);
  buildDeck();
  shuffleDeck();
  startGame();

  //document.getElementById("make-dumber").addEventListener("click", decreaseInt);
  //document.getElementById("make-smarter").addEventListener("click", increaseInt);
}

function decreaseInt() {
  intelligence -= 1;
  if (intelligence == 0){
    var x = document.getElementById("make-dumber");
    x.style.display = 'none';
  }
  x = document.getElementById("make-smarter")
  if (document.getElementById("make-smarter").style.display == 'none'){
      document.getElementById("make-smarter").style.display = 'inline-block';
  }
}

function increaseInt() {
  intelligence += 1;
  if (intelligence == 2){
    var x = document.getElementById("make-smarter");
    x.style.display = 'none';
  }
  x = document.getElementById("make-dumber")
  if (document.getElementById("make-dumber").style.display == 'none'){
    document.getElementById("make-dumber").style.display = 'inline-block';
  }
}


async function selectAgent(){
  if (intelligence == 0){
    const res = await fetch('./assets/js/agents/dumb_agent.json');
    q_table = await res.json();
  }
  else if (intelligence == 1){
    const res = await fetch('./assets/js/agents/default_agent.json');
    q_table = await res.json();
  }
  else{
    const res = await fetch('./assets/js/agents/smart_agent.json');
    q_table = await res.json();
  }
}

async function buildDeck() {
  let values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]
  let types = ["C", "D", "H", "S"]
  deck = [];

  for (let i=0; i < types.length; i++){
    for (let j=0; j < values.length; j++){
      let val = values[j] + "-" + types[i];
      deck.push(val);
      let img = preloadImage("./assets/images/cards/" + val + ".png");
      imgs[val] = img;
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
  let hiddenImg = document.createElement("img");
  hiddenImg.id = "hidden";
  hiddenImg.src = "./assets/images/cards/card_back.png";
  document.getElementById("dealer-cards").append(hiddenImg);
  hidden = draw();
  dealerSum += getValue(hidden);
  dealerAceCount += checkAce(hidden);
  
  await delay(1000);
  let card = draw();
  cardImg = imgs[card];
  dealerSum += getValue(card);
  dealerVisibleSum = getValue(card);
  dealerAceCount += checkAce(card);
  document.getElementById("dealer-cards").append(cardImg);

  for (let i=0; i < 2; i++){
    await delay(1000);
    let card = draw();
    cardImg = imgs[card];
    playerSum += getValue(card);
    playerAceCount += checkAce(card);
    document.getElementById("player-cards").append(cardImg);
  }

  while(canHit){
    await delay(1000);
    let move = await getAction();
    if (move == 1) {
      document.getElementById("player-action").innerText = "Hit";
      await delay(400);
      document.getElementById("player-action").innerHTML = new_player_action;
      await hit();
    }
    else break;
  }

  if (bust){
    await delay(1000);
    document.getElementById("results").innerText = "Bust!";

    await delay(5000);
    init(intelligence);

  }
  else {
    stay();
  }

}

async function getAction() {
  var hasAce = (playerAceCount > 0) ? 1 : 0;
  var state_obs = "" + playerSum + "," + dealerVisibleSum + "," + hasAce;
  var action_space = q_table[state_obs];

  if (typeof action_space == "undefined") {
    var rand = (Math.random() >= 0.5) ? 1 : 0;
    return rand;
  }
  else{
    var action = (action_space[0] > action_space[1]) ? 0 : 1;
    return action
  }
}

async function hit() {
  if (!canHit){
    return;
  }
  await delay(1000);
  let card = draw();
  cardImg = imgs[card];
  playerSum += getValue(card);
  playerAceCount += checkAce(card);
  document.getElementById("player-cards").append(cardImg);
  if (reduceAce(playerSum, playerAceCount) > 21){
    canHit = false;
    bust = true;
  }
}

async function stay() {
  document.getElementById("player-action").innerText = "Stay";
  await delay(1000);
  document.getElementById("hidden").src = "./assets/images/cards/" + hidden + ".png";
  while (dealerSum < 17) {
    await delay(1000);
    let card = draw();
    cardImg = imgs[card];
    dealerSum += getValue(card);
    dealerAceCount += checkAce(card);
    document.getElementById("dealer-cards").append(cardImg);
  }

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
  document.getElementById("results").innerText = message;

  await delay(5000);
  init(intelligence)
}

function draw() {
  let i = Math.floor(Math.random() * deck.length)
  let ret = deck[i];
  deck.splice(i,1);
  return ret;
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

function preloadImage(url){
  var img = new Image();
  img.src = url;
  return img;
}
