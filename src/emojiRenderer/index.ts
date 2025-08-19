import type { ExtensionWebExports } from "@moonlight-mod/types";

export const patches: ExtensionWebExports["patches"] = [
  {
    // Filter out embeds corresponding to fake nitro/freemoji emojis
    find: /\{return"message-reply-context-"/,
    replace: [
      {
        match: /return"message-accessories-"\.concat\((.{1,2}).id\)/,
        replacement: (match, message, a) => {
          return `
                (require("emojiRenderer_entrypoint")).removeEmbedsIfNeeded(${message});
                ${match}
                `;
        }
      }
    ]
  }
];

export const webpackModules: ExtensionWebExports["webpackModules"] = {
  entrypoint: {
    dependencies: [
      { ext: "common", id: "stores" },
      { ext: "markdown", id: "markdown" }
    ],
    entrypoint: true
  }
};
