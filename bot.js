const Discord = require('discord.js');
const fs = require("fs");
const client = new Discord.Client();
client.login('ODMzNzUyNzkwODU2ODkyNDI2.YH26yw.kztoOdiTwMZ3_d7qPKTV-_ResKE');

const is_debug = (process.argv[2] == "debug");

const commands = {
    vote: /%(v|vote)/i,
    ping: /^%(p|ping)$/i,
    id: /^%id$/i,
    yes_or_no: /^%(yrn|yes-or-no)$/i,
    help: /^(s!|%)(h|help)$/i,
    // RPG
    inventory: /^s!(i|inv|inventory|my|me|profile)$/i,
    level: /^s!(l|lvl|level)$/i,
    work: /^s!(w|work)$/i,
    fish: /^s!(f|fish|fishing)$/i,
    casino: /^s!(c|casino) (\d{1,3})$/i,
    transfer: /^s!(t|pay)( <@(!)?[0-9]{16,20}>)? (\d{1,3})$/i,
    give: /^s!(g|gift|give)( <@(!)?[0-9]{16,20}>)? (fish)$/
};

const cooldown = (is_debug)? { work: 6000, fish: 6000 } : { work: 180000, fish: 240000 };
const duration = (is_debug)? { work: 6000, fish: 6000 } : { work: 240000, fish: 360000 };
if               (is_debug) console.log("Entered debug mode.");

const XPGain = { work: [0, 10], fish: [0, 15] };
const XPForLevel = 20;

const e = {
    up: '<:up_vote:872043927589503037>',
    down: '<:down_vote:872043927518199808>',
    vc: '<:voidcoin:872046322990059582>',
    fish: '🐟'
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
    if(text.match(commands.id)) if(message.reference != null) 
        message.channel.messages.fetch(message.reference.messageID).then((messageRef) => message.channel.send(`${messageRef.author.tag}: ${messageRef.author.id}`));
        else message.channel.send(`${message.author.tag}: ${message.author.id}`);

    if(text.match(commands.ping)) {
        message.channel.send("Pinging...").then(msg => {
            var ping = msg.createdTimestamp - message.createdTimestamp;
            msg.edit(new Discord.MessageEmbed().setAuthor(`Ping: ${ping} ms`).setColor("#0234AE"));
        });
    }
    if(text.match(commands.yes_or_no)) if(getRandomInt(1,2) == 1) message.channel.send("Я думаю нет!"); else message.channel.send("Я думаю да!");
    //-----------------------------===================(Команды для РПГ)===================-----------------------------//
    if(text.match(commands.help)) message.channel.send(new Discord.MessageEmbed().setColor("#ffae00").setAuthor("Команды (префикс %):")
        .addField("help", "Выводит это сообщение.", true)
        .addField("vote", `Добавляет ${e.up} и ${e.down} к сообщению. (Команду можно отправить в ответ на сообщение)`, true)
        .addField("id", "Узнать ID пользователя.", true)
        .addField("yrn", "Магией рандома узнать `да` или `нет`.", true)
        .setTimestamp().setFooter('By Tomoko and Kycb42148', 'https://avatars.githubusercontent.com/u/34296702?v=4')).then((msg) => {
            msg.channel.send(new Discord.MessageEmbed().setColor("#ffae00").setAuthor("Игровые команды (префикс s!):")
            .addField("inv | inventory", "Ваш инвентарь.", true)
            .addField("w | work", "Работать!", true)
            .addField("f | fish", "Рыбачить!", true)
            .addField("c | casino <1-999>", "Поставить ставку в казино. С шансом 50% вы получите 150% от указанной суммы", true)
            .addField("t | pay", "(В ответ на сообщение) Переводит указанное количество средств игроку.", true)
            .setTimestamp().setFooter('By Tomoko and Kycb42148', 'https://avatars.githubusercontent.com/u/34296702?v=4'));
        });
    if(text.match(commands.work) || text.match(commands.fish) || text.match(commands.inventory) || text.match(commands.casino) || text.match(commands.transfer) || text.match(commands.give) || text.match(commands.level)){
        let userdata = getUserdata(userId);
        if(text.match(commands.work) || text.match(commands.fish) /*and any other tasks with duration/timeout*/){
            var timenow = Date.now();
            if(userdata.task == "idle"){
                if(text.match(commands.work)){
                    if(userdata.lastcomplete["work"] + cooldown.work < timenow){
                        userdata.task = "work";
                        userdata.lastuse["work"] = timenow;
                        message.channel.send(`Ты пошел на работу. Возвращайся через ${duration.work / 1000} секунд.`);
                    } else message.channel.send(`Ты сможешь снова пойти на работу через ${Math.floor((userdata.lastcomplete["work"] + cooldown["work"] - timenow) / 1000)} секунд.`);
                } else if(text.match(commands.fish)){
                    if(userdata.lastcomplete["fish"] + cooldown.fish < timenow){
                        userdata.task = "fish";
                        userdata.lastuse["fish"] = timenow;
                        message.channel.send(`Ты пошел на рыбалку. Возвращайся через ${duration.fish / 1000} секунд.`);
                    } else message.channel.send(`Ты сможешь снова пойти на рыбалку через ${Math.floor((userdata.lastcomplete["fish"] + cooldown["fish"] - timenow) / 1000)} секунд.`);
                }
            } else if(userdata.task == "work"){
                if(text.match(commands.work)){
                    if(userdata.lastuse["work"] + duration.work < timenow){
                        var moneyget = getRandomInt(2,8);
                        var expget = getRandomInt(XPGain.work[0], XPGain.work[1]);
                        userdata.money += moneyget;
                        message.channel.send(`Ты вернулся с работы, заработав ${moneyget} монет`);
                        userdata = userAddXp(userdata, expget, message.channel);
                        userdata.task = "idle";
                        userdata.lastcomplete["work"] = timenow;
                    } else message.channel.send(`Возвращайся через ${Math.floor((userdata.lastuse["work"] + duration["work"] - timenow) / 1000)} секунд.`);    
                } else message.channel.send(`Ты на работе.`);
            } else if(userdata.task == "fish"){
                if(text.match(commands.fish)){
                    if(userdata.lastuse["fish"] + duration.fish < timenow){
                        var fishget = getRandomInt(0,3);
                        var expget = getRandomInt(XPGain.fish[0], XPGain.fish[1]);
                        userdata.items.fish += fishget;
                        message.channel.send(`Ты вернулся с рыбалки и принес ${fishget} рыб(ы)!`);
                        userdata = userAddXp(userdata, expget, message.channel);
                        userdata.task = "idle";
                        userdata.lastcomplete["fish"] = timenow;
                    } else message.channel.send(`Возвращайся через ${Math.floor((userdata.lastuse["fish"] + duration["fish"] - timenow) / 1000)} секунд.`);
                } else message.channel.send(`Ты на рыбалке.`);
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
            const amount = Number(text.match(commands.transfer)[4]);
            if(amount > 0){
                if(userdata.money >= amount){
                    let receiver = null;
                    if(text.match(commands.transfer)[2] != null && text.match(commands.transfer)[2] != false && text.match(commands.transfer)[2] !== undefined){
                        receiver = text.match(commands.transfer)[2].replace(" <@", "").replace("!", "").replace(">", "");
                        if(receiver != null){
                            if(receiver != message.author.id){
                                let receivedata = getUserdata(receiver);
                                receivedata.money = Number(receivedata.money) + amount;
                                userdata.money = Number(userdata.money) - amount;
                                fs.writeFileSync(__dirname + `/data/users/${receiver}.json`, JSON.stringify(receivedata));
                                fs.writeFileSync(__dirname + `/data/users/${userId}.json`, JSON.stringify(userdata));
                                message.channel.send(`Ты перевёл ${amount + e.vc} игроку <@`+receiver+">");
                            } else message.channel.send("_Перевод самому себе? Зачем?_");
                        }
                    }
                    else if (message.reference != null){
                        message.channel.messages.fetch(message.reference.messageID).then((messageRef) => {
                            receiver = messageRef.author.id;
                            if(receiver != null){
                                if(receiver != message.author.id){
                                    let receivedata = getUserdata(receiver);
                                    receivedata.money = Number(receivedata.money) + amount;
                                    userdata.money = Number(userdata.money) - amount;
                                    fs.writeFileSync(__dirname + `/data/users/${receiver}.json`, JSON.stringify(receivedata));
                                    fs.writeFileSync(__dirname + `/data/users/${userId}.json`, JSON.stringify(userdata));
                                    message.channel.send(`Ты перевёл ${amount + e.vc} игроку <@`+receiver+">");
                                } else message.channel.send("_Перевод самому себе? Зачем?_");
                            }
                        }).catch(console.error);
                    }
                } else message.channel.send("Недостаточно монет!");
            } else message.channel.send("Это так не работает");
        }
        if(text.match(commands.inventory)){
            message.channel.send(new Discord.MessageEmbed().setColor("#ffae00").setAuthor("Инвантарь:")
                .addField(`Монеты:`, `${userdata.money}${e.vc}`, true)
                .addField(`Уровень:`, `${userdata.lvl}${e.up} ||(команда s!lvl)||`, true)
                .addField(`Рыба:`, `${userdata.items.fish}${e.fish}`, false)
                .setTimestamp().setFooter('By Tomoko and Kycb42148', 'https://avatars.githubusercontent.com/u/34296702?v=4'));
        }
        if(text.match(commands.level)){
            var XPPercent = (userdata.xp / (XPForLevel + (XPForLevel * userdata.lvl))) * 20;
            var XPBar = "";
            if(userdata.xp > 0){
                XPBar = "**";
                for (let i = 0; i < XPPercent; i++) { XPBar += "/" }
                XPBar += "**";
            }
            for (let i = 0; i < (20 - XPPercent); i++) { XPBar += "/" }
            message.channel.send(
                `Уровень: **${userdata.lvl}**\n` +
                `[${XPBar}] (${userdata.xp} / ${(XPForLevel + (XPForLevel * userdata.lvl))})`
            );
        }
        fs.writeFileSync(__dirname + `/data/users/${userId}.json`, JSON.stringify(userdata));
    }
});

function getUserdata(userId){
    try {
        fs.accessSync(`${__dirname}\\data\\users\\${userId}.json`);
        return JSON.parse(fs.readFileSync(`${__dirname}\\data\\users\\${userId}.json`));
    } catch (error){
        let userdata = { money: 20, xp: 0, lvl: 0, lastuse: { work: 0, fish: 0 }, lastcomplete: { work: 0, fish: 0 }, task: "idle", items: { fish: 0 }};
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