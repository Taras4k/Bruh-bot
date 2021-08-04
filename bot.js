const Discord = require('discord.js');
const fs = require("fs");
const client = new Discord.Client();
client.login('ODMzNzUyNzkwODU2ODkyNDI2.YH26yw.kztoOdiTwMZ3_d7qPKTV-_ResKE');

const is_debug = (process.argv[2] == "debug");

const commands = {
    vote: /^%(v|vote)$/i,
    ping: /^%(p|ping)$/i,
    myid: /^%(myid|id|mi)$/i,
    yes_or_no: /^%(yrn|yes-or-no)$/i,
    help: /^(s!|%)(h|help)$/i,
    // RPG
    inventory: /^s!(i|inv|inventory|my|me|profile)$/i,
    work: /^s!(w|work)$/i,
    casino: /^s!(c|casino) (\d{1,3})$/i,
    transfer: /^s!(t|pay) (\d{1,3})$/i,
};

const cooldown = (is_debug)? { work: 6000 } : { work: 180000 };
const duration = (is_debug)? { work: 6000 } : { work: 240000 };
if               (is_debug) console.log("Entered debug mode.");

const XPGain = { work: [0, 10] };
const XPForLevel = 20;

const e = {
    up: '<:up_vote:872043927589503037>',
    down: '<:down_vote:872043927518199808>',
    vc: '<:voidcoin:872046322990059582>'
};

client.on('ready', () => console.log(`Logged in as ${client.user.tag}`));

function getRandomInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

client.on('message', message => {
    const text = message.content;
    const userId = message.author.id;

    if(text.match(commands.vote)){
        if(message.reference == null){
            message.react(e.up);
            message.react(e.down);
        }else{
            message.channel.messages.fetch(message.reference.messageID).then((messageRef) => {
                messageRef.react(e.up);
                messageRef.react(e.down);
                message.delete({timeout: 1000}).catch((error) => console.log(`Can't delete message! Error: ${error}`));
            });
        }
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
        .setTimestamp().setFooter('By Tomoko and Kycb42148', 'https://avatars.githubusercontent.com/u/34296702?v=4'));
    if(text.match(commands.work) || text.match(commands.inventory) || text.match(commands.casino) || text.match(commands.transfer)){
        let userdata = getUserdata(userId);
        if(text.match(commands.work) /*and any other tasks with duration/timeout*/){
            var timenow = Date.now();
            if(userdata.task == "idle"){
                if(text.match(commands.work)){
                    if(userdata.lastcomplete["work"] + cooldown.work < timenow){
                        userdata.task = "work";
                        userdata.lastuse["work"] = timenow;
                        message.channel.send(`Ты пошел на работу. Возвращайся через ${duration.work / 1000} секунд.`);
                    } else message.channel.send(`Ты сможешь снова пойти на работу через ${Math.floor((userdata.lastcomplete["work"] + cooldown["work"] - timenow) / 1000)} секунд.`);
                }
            } else if(userdata.task == "work" && text.match(commands.work)){
                if(userdata.lastuse["work"] + duration.work < timenow){
                    var moneyget = getRandomInt(2,8);
                    var expget = getRandomInt(XPGain.work[0], XPGain.work[1]);
                    userdata.money += moneyget;
                    message.channel.send(`Ты вернулся с работы, заработав ${moneyget} монет`);
                    userdata = userAddXp(userdata, expget, message.channel);
                    userdata.task = "idle";
                    userdata.lastcomplete["work"] = timenow;
                } else message.channel.send(`Возвращайся через ${Math.floor((userdata.lastuse["work"] + duration["work"] - timenow) / 1000)} секунд.`);
            }
        }
        if(text.match(commands.casino)){
            const amount = text.match(commands.casino)[2];
            if(userdata.money >= amount){
                userdata.money -= amount;
                if(getRandomInt(1,2) == 1){
                    message.channel.send(`Повезло! Вы выиграли ${Math.round(amount * 1.5)} монет, потратив ${amount}!`);
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
                .addField(`Level:`, `${userdata.lvl}${e.up}`, true)
                .setTimestamp().setFooter('By Tomoko and Kycb42148', 'https://avatars.githubusercontent.com/u/34296702?v=4'));
        }
        fs.writeFileSync(__dirname + `/data/users/${userId}.json`, JSON.stringify(userdata));
    }
});

function getUserdata(userId){
    try {
        fs.accessSync(`${__dirname}\\data\\users\\${userId}.json`);
        return JSON.parse(fs.readFileSync(`${__dirname}\\data\\users\\${userId}.json`));
    } catch (error){
        let userdata = { money: 20, xp: 0, lvl: 0, lastuse: { work: 0}, lastcomplete: { work: 0 }, task: "idle"};
        fs.writeFileSync(__dirname + `\\data\\users\\${userId}.json`, JSON.stringify(userdata));
        return userdata;
    }
}

function userAddXp(data, amount, channel){
    let userdata = data;
    userdata.xp += amount;
    if(userdata.xp >= (XPForLevel + (XPForLevel * userdata.lvl))){
        while (userdata.xp >= (XPForLevel + (XPForLevel * userdata.lvl))) {
            userdata.xp -= XPForLevel + (XPForLevel * userdata.lvl);
            userdata.lvl++;
            if(channel != null) channel.send(`<:up_vote:872043927589503037> Вы повысили уровень до ${userdata.lvl}!`);
        }
    }
    return userdata;
}