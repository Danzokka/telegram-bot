// Released under MIT License
// Copyright (c) Muthu Kumar <@MKRhere> (https://mkr.pw)
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Refer to: https://github.com/telegraf/telegraf/issues/1323
// Requires Telegraf v4.11.0 or above

import type { Context } from 'telegraf';
import { channelPost } from 'telegraf/filters';
import type { MessageEntity } from 'telegraf/types';

export const channelMode =
  () =>
  <C extends Context>(ctx: C, next: () => Promise<void>) => {
    // check if this update is a channelPost
    if (!ctx.has(channelPost('text'))) return next();

    if (ctx.channelPost.text.startsWith('/')) {
      // create a new bot_command entity
      const entity: MessageEntity = {
        type: 'bot_command',
        offset: 0,
        length: ctx.channelPost.text.split(' ')[0].length,
      };

      // insert the created entity in the channelPost's entities array (or create it)
      (ctx.channelPost.entities ??= []).unshift(entity);
    }

    /* Create a message object in update, so this update will now start matching both channelPost and message related handlers.
		This means bot.command and bot.hears will work on channels now */
    // @ts-expect-error ignore this error, because obviously channel_post updates don't normally have message, we're doing something wonky
    ctx.update.message = ctx.channelPost;
    return next();
  };
