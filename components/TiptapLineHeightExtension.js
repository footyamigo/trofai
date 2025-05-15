import { Extension } from "@tiptap/core";

export const LineHeight = Extension.create({
  name: "lineHeight",

  addOptions() {
    return {
      types: ["heading", "paragraph"],
      heights: ["1", "1.1", "1.2", "1.3", "1.4", "1.5"],
      defaultHeight: "1.1",
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultHeight,
            parseHTML: (element) =>
              element.style.lineHeight || this.options.defaultHeight,
            renderHTML: (attributes) => {
              if (attributes.lineHeight === this.options.defaultHeight) {
                return {};
              }
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight: (height) => ({ commands, state }) => {
        const { $from } = state.selection;
        const parentType = $from.parent.type.name;
        console.log('[LineHeight Extension] Current parent node type:', parentType);
        console.log('[LineHeight Extension] setLineHeight called with:', height);
        if (!this.options.heights.includes(height)) {
          console.warn('[LineHeight Extension] Invalid height:', height);
          return false;
        }
        return this.options.types.every((type) =>
          commands.updateAttributes(type, { lineHeight: height })
        );
      },
      unsetLineHeight: () => ({ commands }) => {
        return this.options.types.every((type) =>
          commands.resetAttributes(type, "lineHeight")
        );
      },
    };
  },
});

export default LineHeight; 