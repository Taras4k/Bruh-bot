const Discord = require('discord.js');
const fs = require("fs");
const client = new Discord.Client();

const commands = {
    vote: /^(%)(v|vote)/i,
    ping: /^(%)(p|ping)/i,
    myid: /^(%)(myid|id|mi)/i,
    yes_or_no: /^(%)(yrn|yes-or-no)/i,
    tomoko: /^(%)(pingtomoko)/i,
    // RPG
    inventory: /^(s!)(i|inv|inventory)/i,
    work: /^(s!)(w|work)/i,
    fish: /^(s!)(f|fish)/i,
    create_data: /^(s!)(create-data)/i,
    help: /^(%)(h|help)/i
};

var num = 0
var fishget = 0
var fish = 0
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

client.on('message', message => {

    const text = message.content;
    const userId = message.author.id;

    if(text.match(commands.vote)){
        message.react('<a:voteup:864886664064925716>');
        message.react('<a:votedown:864886641712693278>');
    }
    if(text.match(commands.myid)){
        message.channel.send("Айди " + message.author.tag + ": " + message.author.id)
    }
    if(text.match(commands.ping)) {
        message.channel.send("\nPinging...").then(msg => {
            var ping = msg.createdTimestamp - message.createdTimestamp;
            var embed = new Discord.MessageEmbed().setAuthor(`Ping: ${ping} ms`).setColor("#0234AE");
            msg.edit(embed);
        });
    }
    if(text.match(commands.yes_or_no)){
       var num = getRandomInt(1,2)
       if(num == 1){
           message.channel.send("Я думаю Нет!");
       }
       if(num == 2){
           message.channel.send("Я думаю Да!");
       }
       
    }
    if(text.match(commands.tomoko)){
        setInterval(function(){
            message.channel.send('<@602076422474956800>');
        }, 10);
    }
    //-----------------------------===================(Комманды для РПГ)===================-----------------------------
    if(text.match(commands.work)){
        var moneyget = getRandomInt(0,5);
        var money = money + moneyget
        message.channel.send("Ты пошёл на роботу И зароботал: " + moneyget + "Монет");
        fs.writeFileSync( `./data/users/${userId}.json` , JSON.stringify(money));
    }
    if(text.match(commands.create_data)){
        userdata = {money: 20};
        fs.writeFileSync( `./data/users/${userId}.json` , JSON.stringify(userdata) );
    }
    if(text.match(commands.help)){
        var embed = new Discord.MessageEmbed().setColor("#ffae00").setAuthor("Help:");
        embed.addField("**Commands**:");
        embed.addField("help", "Выводит это сообщение.", true);
        embed.addField("inv | inventory", "Ваш баланс.", true);
        embed.addField("p | profile", "Ваш профиль.", );
        embed.setTimestamp().setFooter('By Taras4k.', 'https://i.imgur.com/jScb98B.jpg');
        channel.send(embed);
    }
    if(text.match(commands.inventory)){
        var embed = new Discord.MessageEmbed().setColor("#ffae00").setAuthor("Inventory:");
        embed.addField("**Inventory**:");
        embed.addField('Coins: ' + money + '<:voidcoins:858724718303510550>')
        embed.setTimestamp().setFooter('By Taras4k.', 'https://i.imgur.com/jScb98B.jpg');
        channel.send(embed);
    }
});

client.login('ODMzNzUyNzkwODU2ODkyNDI2.YH26yw.kztoOdiTwMZ3_d7qPKTV-_ResKE');

/* Videos
https://stackoverflow.com/questions/66106762/discord-js-how-to-mention-message-author - Mеssages

*/