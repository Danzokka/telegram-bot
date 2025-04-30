import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Telegraf } from 'telegraf';
import axios from 'axios';

@Injectable()
export class BotService implements OnModuleInit {
  private bot: Telegraf;

  constructor() {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error(
        'TELEGRAM_BOT_TOKEN is not defined in the environment variables.',
      );
    }
    this.bot = new Telegraf(botToken);
  }

  async onModuleInit() {
    this.bot.start((ctx) => {
      ctx.reply(
        'Olá! Eu sou o bot TL;DR. Enviarei resumos de notícias para você!',
      );
    });

    const channelId = process.env.TELEGRAM_CHAT_ID;
    if (!channelId) {
      throw new Error(
        'TELEGRAM_CHAT_ID is not defined in the environment variables.',
      );
    }

    this.bot.command('tldr', async (ctx) => {
      const news = await this.fetchNews();
      const bitcoinPrice = await this.fetchBitcoinPrice();
      ctx.reply(`${news}\n\n${bitcoinPrice}`);
    });

    this.bot.command('bitcoin', async (ctx) => {
      const bitcoinData = await this.fetchBitcoinData();
      await ctx.reply(bitcoinData);
    });

    this.bot.command('crypto', async (ctx) => {
      const cryptoNews = await this.fetchCryptoNews();
      ctx.reply(cryptoNews);
    });

    this.bot.command('nextjs', async (ctx) => {
      const nextjsNews = await this.fetchNextjsNews();
      ctx.reply(nextjsNews);
    });

    this.bot.command('nestjs', async (ctx) => {
      const nestjsNews = await this.fetchNestjsNews();
      ctx.reply(nestjsNews);
    });

    this.bot.command('aws', async (ctx) => {
      const awsNews = await this.fetchAwsNews();
      ctx.reply(awsNews);
    });

    await this.bot.launch();

    // Enviar mensagem para o OWNER_CHAT quando o bot estiver online
    const ownerChatId = process.env.OWNER_CHAT;
    if (ownerChatId) {
      await this.bot.telegram.sendMessage(
        ownerChatId,
        'O bot está online e pronto para uso!',
      );
    }

    // Exemplo de envio de mensagem para o canal ao iniciar
    await this.bot.telegram.sendMessage(
      channelId,
      'O bot foi iniciado e está pronto para enviar atualizações!',
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async sendPeriodicUpdates() {
    const news = await this.fetchNews();
    const bitcoinPrice = await this.fetchBitcoinPrice();
    const message = `${news}\n\n${bitcoinPrice}`;
    const chatID = parseInt(process.env.TELEGRAM_CHAT_ID || '0', 10);
    this.bot.telegram.sendMessage(chatID, message);
  }

  private async fetchNews(): Promise<string> {
    try {
      const apiKey = process.env.NEWSAPI_KEY;
      const response = await axios.get(
        `https://newsapi.org/v2/top-headlines?category=technology&language=en&apiKey=${apiKey}`,
      );
      const articles = response.data.articles.slice(0, 5);
      let message = '📰 *Últimas Notícias de Tecnologia:*\n\n';
      articles.forEach((article) => {
        message += `- [${article.title}](${article.url})\n`;
      });
      return message;
    } catch (error) {
      return 'Erro ao buscar notícias.';
    }
  }

  private async fetchBitcoinPrice(): Promise<string> {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      );
      const price = response.data.bitcoin.usd;
      return `💰 *Preço do Bitcoin:* $${price}`;
    } catch (error) {
      return 'Erro ao buscar preço do Bitcoin.';
    }
  }

  private async fetchBitcoinData(): Promise<string> {
    const price = await this.fetchBitcoinPrice();
    return `${price}\nCrescimento: +2% (exemplo)`;
  }

  private async fetchCryptoNews(): Promise<string> {
    return await this.fetchNewsByCategory('crypto');
  }

  private async fetchNextjsNews(): Promise<string> {
    return await this.fetchNewsByCategory('nextjs');
  }

  private async fetchNestjsNews(): Promise<string> {
    return await this.fetchNewsByCategory('nestjs');
  }

  private async fetchAwsNews(): Promise<string> {
    return await this.fetchNewsByCategory('aws');
  }

  private async fetchNewsByCategory(category: string): Promise<string> {
    try {
      const apiKey = process.env.NEWSAPI_KEY;
      const response = await axios.get(
        `https://newsapi.org/v2/everything?q=${category}&language=en&apiKey=${apiKey}`,
      );
      const articles = response.data.articles.slice(0, 5);
      let message = `📰 *Últimas Notícias sobre ${category}:*\n\n`;
      articles.forEach((article) => {
        message += `- [${article.title}](${article.url})\n`;
      });
      return message;
    } catch (error) {
      return `Erro ao buscar notícias de ${category}.`;
    }
  }
}
