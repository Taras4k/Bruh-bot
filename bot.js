const Discord = require('discord.js');
const fs = require("fs");
const client = new Discord.Client();
client.login('ODMzNzUyNzkwODU2ODkyNDI2.YH26yw.kztoOdiTwMZ3_d7qPKTV-_ResKE');

const commands = {
    vote: /^%(v|vote)/i,
    ping: /^%(p|ping)/i,
    myid: /^%(myid|id|mi)/i,
    yes_or_no: /^%(yrn|yes-or-no)/i,
    // RPG
    inventory: /^s!(i|inv|inventory)/i,
    work: /^s!(w|work)/i,
    fish: /^s!(f|fish|fishing)/i,
    help: /^(s!|%)(h|help)/i,
    casino: /^s!(c|casino) (\d{1,3})$/i,
    transfer: /^s!(t|pay) (\d{1,3})$/i,
};

const e = {
    up: '<a:voteup:864886664064925716>',
    down: '<a:votedown:864886641712693278>',
    vc: '<:voidcoin:866191410133991445>'
};

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

function getRandomInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

client.on('message', message => {
    const text = message.content;
    const userId = message.author.id;

    if(text.match(commands.vote)){
        message.react(e.up);
        message.react(e.down);
    }
    if(text.match(commands.myid)) message.channel.send(`${message.author.tag}: ${message.author.id}`);

    if(text.match(commands.ping)) {
        message.channel.send("Pinging...").then(msg => {
            var ping = msg.createdTimestamp - message.createdTimestamp;
            msg.edit(new Discord.MessageEmbed().setAuthor(`Ping: ${ping} ms`).setColor("#0234AE"));
        });
    }
    if(text.match(commands.yes_or_no)) if(getRandomInt(1,2) == 1) message.channel.send("Я думаю нет!"); else message.channel.send("Я думаю да!");
    //-----------------------------===================(Команды для РПГ)===================-----------------------------//
    if(text.match(commands.help)) message.channel.send(new Discord.MessageEmbed().setColor("#ffae00").setAuthor("Команды:")
        .addField("help", "Выводит это сообщение.", true)
        .addField("inv | inventory", "Ваш инвентарь.", true)
        .addField("c | casino <1-999>", "Поставить ставку в казино. С шансом 50% вы получите 150% от указанной суммы", true)
        .addField("t | pay", "(В ответ на сообщение) Переводит указанное количество средств игроку.", true)
        .setTimestamp().setFooter('By Tomoko and Kycb42148', 'https://i.imgur.com/jScb98B.jpg'));
    if(text.match(commands.work) || text.match(commands.inventory) || text.match(commands.casino) || text.match(commands.transfer)){
        let userdata = getUserdata(userId);
        if(text.match(commands.work)){
            var moneyget = getRandomInt(0,5);
            userdata.money += moneyget;
            message.channel.send(`Ты пошёл на работу и заработал ${moneyget} монет`);
            fs.writeFileSync(__dirname + `/data/users/${userId}.json` , JSON.stringify(userdata));
        }
        if(text.match(commands.casino)){
            const amount = text.match(commands.casino)[2];
            if(userdata.money >= amount){
                userdata.money -= amount;
                if(getRandomInt(1,2) == 1){
                    message.channel.send(`Повезло! Вы выиграли ${Math.round(amount * 1.5)} монет, потратив ${amount}`);
                    userdata.money += Math.round(amount * 1.5);
                    console.log(userdata);
                } else message.channel.send(`Не повезло... Вы потратили ${amount} монет, ничего не получив.`);
            } else message.channel.send("Недостаточно монет!");
        }
        if (text.match(commands.transfer)){
            if (message.reference != null){
                message.channel.messages.fetch(message.reference.messageID).then((messageRef) => {
                    const amount = Number(text.match(commands.transfer)[2]);
                    if(amount > 0){
                        if(userdata.money >= amount){
                            let receivedata = getUserdata(messageRef.author.id);
                            receivedata.money = Number(receivedata.money) + amount;
                            userdata.money = Number(userdata.money) - amount;
                            fs.writeFileSync(__dirname + `/data/users/${messageRef.author.id}.json`, JSON.stringify(receivedata));
                            fs.writeFileSync(__dirname + `/data/users/${userId}.json`, JSON.stringify(userdata));
                            message.channel.send(`Ты перевёл ${amount + e.vc} игроку ${messageRef.author.tag}`);
                        } else message.channel.send("Недостаточно монет!");
                    } else message.channel.send("Это так не работает");
                }).catch(console.error);
            } else message.channel.send("Сообщение должно быть отправлено в ответ на сообщение!");
        }
        if(text.match(commands.inventory)){
            message.channel.send(new Discord.MessageEmbed().setColor("#ffae00").setAuthor("Inventory:")
            .addField(`Coins:`, `${userdata.money}${e.vc}`, true)
            .setTimestamp().setFooter('By Tomoko and Kycb42148', 'https://i.imgur.com/jScb98B.jpg'));
        }
        fs.writeFileSync(__dirname + `/data/users/${userId}.json`, JSON.stringify(userdata));
    }
});

function getUserdata(userId){
    try {
        fs.accessSync(`${__dirname}\\data\\users\\${userId}.json`);
        return JSON.parse(fs.readFileSync(`${__dirname}\\data\\users\\${userId}.json`));
    } catch (error){
        userdata = {money:20};
        fs.writeFileSync(__dirname + `\\data\\users\\${userId}.json`, JSON.stringify(userdata));
        return {money: 20};
    }
}
