import {
  Capture,
  MarkdownRule,
  MatchFunction,
  ParseFunction,
  Parser,
  SlateRule,
  State
} from "@moonlight-mod/types/coreExtensions/markdown";
import { EmojiStore } from "@moonlight-mod/wp/common_stores";
import * as markdown from "@moonlight-mod/wp/markdown_markdown";

const logger = moonlight.getLogger("EmojiRenderer");

type Embed = {
  type: string;
  image: {
    url: string;
  };
};

type Message = {
  content: string;
  embeds: Embed[];
};

const isEmojiurl = (url: string) => {
  return /https?:\/\/.+?\/emojis\/(\d+).(webp|png|gif).+?/.test(url);
};

export const removeEmbedsIfNeeded = (msgRef: Message) => {
  // skip messages not containing any emoji
  if (!isEmojiurl(msgRef.content)) {
    return;
  }

  // remove embeds corresponding to emojis
  msgRef.embeds = msgRef.embeds.filter((emb) => {
    const isEmojiEmbed = emb.type === "image" && isEmojiurl(emb.image.url);
    return !isEmojiEmbed;
  });
};

const freeMojiRegex = /^\[(.+?)\]\(https?:\/\/.+?\/emojis\/(\d+).(webp|png|gif).+?\)/;
// const freeMojiRegex = /^<freemoji:(\d+)>/;
const freeMojiMatch: MatchFunction = ((regex) => {
  const f = (source: string, state: State, prevCapture: string) => {
    return regex.exec(source);
  };
  f.regex = regex;
  return f;
})(freeMojiRegex);

const freeMojiParse: ParseFunction = (capture: Capture, nestedParse: Parser, state: State) => {
  const emoji = EmojiStore.getCustomEmojiById(capture[2]);

  return {
    type: "customEmoji",
    // we use Capture instead of emoji.id since in case the emoji isn't found by the store
    // we still want the client to handle rendering it without crashing
    emojiId: capture[2],
    name: emoji?.allNamesString || capture[1] || "freeMoji",
    animated: emoji?.animated || false
  };
};

const freeMojiMarkdownRule = (rules: Record<string, MarkdownRule>): MarkdownRule => {
  // const order = rules.codeBlock.order;
  const order = -999;
  const match = freeMojiMatch;
  const parse = freeMojiParse;

  return { order, match, parse };
};
const freeMojiSlateRule = (rules: Record<string, SlateRule>): SlateRule => {
  return { type: "verbatim" };
};

markdown.addRule("emojiRender", freeMojiMarkdownRule, freeMojiSlateRule);
