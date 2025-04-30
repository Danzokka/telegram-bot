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
    this.bot.start(async (ctx) => {
      const commands = [
        '/bitcoin - Preço do Bitcoin',
        '/crypto - Notícias sobre criptomoedas',
        '/nextjs - Notícias sobre Next.js',
        '/nestjs - Notícias sobre NestJS',
        '/aws - Notícias sobre AWS',
        '/clima <cidade> - Clima de uma cidade',
        '/tempo <cidade> - Tempo de uma cidade',
        '/noticia <categoria> - Notícias de uma categoria específica',
      ];

      const message = `*Comandos Disponíveis:*\n\n${commands.join('\n')}`;
      await ctx.reply(message, { parse_mode: 'Markdown' });
    });

    this.bot.command('/', async (ctx) => {
      const commands = [
        '/bitcoin - Preço do Bitcoin',
        '/crypto - Notícias sobre criptomoedas',
        '/nextjs - Notícias sobre Next.js',
        '/nestjs - Notícias sobre NestJS',
        '/aws - Notícias sobre AWS',
        '/clima <cidade> - Clima de uma cidade',
        '/tempo <cidade> - Tempo de uma cidade',
        '/noticia <categoria> - Notícias de uma categoria específica',
      ];

      const message = `*Comandos Disponíveis:*\n\n${commands.join('\n')}`;
      await ctx.reply(message, { parse_mode: 'Markdown' });
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

    this.bot.command('clima', async (ctx) => {
      const city = ctx.message.text.split(' ')[1];
      if (!city) {
        return ctx.reply(
          'Por favor, forneça uma cidade. Exemplo: /clima São Paulo',
        );
      }

      const weatherData = await this.fetchWeather(city);
      await ctx.reply(weatherData, { parse_mode: 'Markdown' });
    });

    this.bot.command('tempo', async (ctx) => {
      const city = ctx.message.text.split(' ')[1];
      if (!city) {
        return ctx.reply(
          'Por favor, forneça uma cidade. Exemplo: /tempo Rio de Janeiro',
        );
      }

      const weatherData = await this.fetchWeather(city);
      await ctx.reply(weatherData, { parse_mode: 'Markdown' });
    });

    this.bot.command('noticia', async (ctx) => {
      const category = ctx.message.text.split(' ')[1];
      if (!category) {
        return ctx.reply(
          'Por favor, forneça uma categoria. Exemplo: /noticia tecnologia',
        );
      }

      const newsData = await this.fetchNewsByCategory(category);
      await ctx.reply(newsData, { parse_mode: 'Markdown' });
    });

    this.bot.telegram.setMyCommands([
      { command: 'bitcoin', description: 'Preço do Bitcoin' },
      { command: 'crypto', description: 'Notícias sobre criptomoedas' },
      { command: 'nextjs', description: 'Notícias sobre Next.js' },
      { command: 'nestjs', description: 'Notícias sobre NestJS' },
      { command: 'aws', description: 'Notícias sobre AWS' },
      { command: 'clima', description: 'Clima de uma cidade' },
      { command: 'tempo', description: 'Tempo de uma cidade' },
      {
        command: 'noticia',
        description: 'Notícias de uma categoria específica',
      },
    ]);

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

  private async fetchWeather(city: string): Promise<string> {
    try {
      const apiKey = process.env.WEATHER_API_KEY;
      if (!apiKey) {
        throw new Error('A chave da API OpenWeatherMap não está configurada.');
      }

      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city.split('_').join(' '))}&appid=${apiKey}&units=metric&lang=pt_br`,
      );


      const { weather, main, name } = response.data;
      return `🌤️ *Clima em ${name}:*\n\n- Condição: ${weather[0].description}\n- Temperatura: ${main.temp}°C\n- Sensação Térmica: ${main.feels_like}°C\n- Umidade: ${main.humidity}%`;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return 'Cidade não encontrada. Verifique o nome e tente novamente.';
      }
      return 'Erro ao buscar informações climáticas. Tente novamente mais tarde.';
    }
  }
}
