const { Telegraf, session } = require('telegraf');
const axios = require('axios');

const bot = new Telegraf(process.env.7939764251:AAFMB9b1QvgycFrPW39u_iiExLn7rPe-oMw);
let channelId = '@CMD_CNN_1'; // آیدی کانال با @ یا عددی
const adminId = 7692563400;
const users = new Set();

const languages = [
    { code: 'fa', name: 'فارسی' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'zh', name: '中文' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'ar', name: 'العربية' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ru', name: 'Русский' },
    { code: 'pt', name: 'Português' },
    { code: 'ja', name: '日本語' },
    { code: 'it', name: 'Italiano' }
];

// فعال‌سازی سشن
bot.use(session());

// خوش‌آمدگویی و بررسی عضویت
bot.start(async (ctx) => {
    users.add(ctx.from.id);
    try {
        const member = await ctx.telegram.getChatMember(channelId, ctx.from.id);
        if (['member', 'administrator', 'creator'].includes(member.status)) {
            const keyboard = languages.map(lang => [{ text: lang.name, callback_data: `lang_${lang.code}` }]);
            ctx.reply('زبان ترجمه را انتخاب کنید:', {
                reply_markup: {
                    inline_keyboard: keyboard
                }
            });
        } else {
            ctx.reply('لطفاً ابتدا در کانال ما عضو شوید:', {
                reply_markup: {
                    inline_keyboard: [[{ text: 'عضویت در کانال', url: `https://t.me/${channelId.slice(1)}` }]]
                }
            });
        }
    } catch (error) {
        console.error('خطا در بررسی عضویت:', error.message);
        ctx.reply('خطا! لطفاً مطمئن شوید ربات ادمین کانال است و دوباره امتحان کنید.');
    }
});

// انتخاب زبان
bot.action(/lang_(.+)/, (ctx) => {
    ctx.session = ctx.session || {};
    ctx.session.targetLang = ctx.match[1];
    const langName = languages.find(lang => lang.code === ctx.match[1])?.name || ctx.match[1];
    ctx.reply(`زبان مقصد: ${langName}`);
});

// ترجمه متن با تشخیص زبان
bot.on('text', async (ctx) => {
    if (!ctx.session?.targetLang) return ctx.reply('ابتدا زبان را انتخاب کنید.');
    const text = ctx.message.text;
    let sourceLang = 'auto';

    // تشخیص زبان (بدون IP، چون ctx.request.ip در دسترس نیست)
    try {
        const response = await axios.post('https://libretranslate.com/translate', {
            q: text,
            source: sourceLang,
            target: ctx.session.targetLang,
            format: 'text'
        });
        ctx.reply(`ترجمه: ${response.data.translatedText}`);
    } catch (error) {
        console.error('خطا در ترجمه:', error.message);
        ctx.reply('خطا در ترجمه! دوباره امتحان کنید.');
    }
});

// ارسال پیام انبوه
bot.command('broadcast', async (ctx) => {
    if (ctx.from.id !== adminId) return ctx.reply('فقط ادمین می‌تواند پیام انبوه بفرستد.');
    const message = ctx.message.text.split(' ').slice(1).join(' ');
    if (!message) return ctx.reply('لطفاً متن پیام را وارد کنید.');
    for (const userId of users) {
        try {
            await ctx.telegram.sendMessage(userId, message);
        } catch (error) {
            console.error(`خطا در ارسال به ${userId}:`, error.message);
        }
    }
    ctx.reply('پیام انبوه با موفقیت ارسال شد!');
});

// تنظیم یا حذف کانال اجباری
bot.command('setchannel', async (ctx) => {
    if (ctx.from.id !== adminId) return ctx.reply('فقط ادمین می‌تواند کانال را تنظیم کند.');
    const newChannel = ctx.message.text.split(' ').slice(1).join(' ');
    if (newChannel.startsWith('@')) {
        try {
            const chat = await ctx.telegram.getChat(newChannel);
            if (chat.type === 'channel') {
                channelId = newChannel;
                ctx.reply(`کانال اجباری به ${newChannel} تنظیم شد. لطفاً ربات را ادمین کانال کنید.`);
            } else {
                ctx.reply('لطفاً یک کانال معتبر وارد کنید.');
            }
        } catch (error) {
            console.error('خطا در تنظیم کانال:', error.message);
            ctx.reply('خطا! مطمئن شوید ربات ادمین کانال است.');
        }
    } else if (newChannel === 'remove') {
        channelId = null;
        ctx.reply('الزام عضویت در کانال حذف شد.');
    } else {
        ctx.reply('لطفاً آیدی کانال را با @ وارد کنید یا برای حذف از "remove" استفاده کنید.');
    }
});

// برای long polling
bot.launch();
console.log('ربات شروع شد!');
