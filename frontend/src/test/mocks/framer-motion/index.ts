import React from "react";

const motion = {
  div: ({ children, ...props }: any) =>
    React.createElement("div", props, children),
  nav: ({ children, ...props }: any) =>
    React.createElement("nav", props, children),
  ul: ({ children, ...props }: any) =>
    React.createElement("ul", props, children),
  li: ({ children, ...props }: any) =>
    React.createElement("li", props, children),
};

const AnimatePresence = ({ children }: { children: React.ReactNode }) =>
  React.createElement(React.Fragment, null, children);

export default {
  motion,
  AnimatePresence,
};
