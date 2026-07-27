import React from 'react';

/**
 * EMERGENCY RECOVERY MOCK
 * This file provides a safety mock for motion/react to prevent white screen crashes
 * when the library fails to initialize properly in the preview environment.
 */

export const motion = {
  div: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <div {...props}>{children}</div>,
  button: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <button {...props}>{children}</button>,
  span: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <span {...props}>{children}</span>,
  h1: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <h1 {...props}>{children}</h1>,
  h2: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <h2 {...props}>{children}</h2>,
  h3: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <h3 {...props}>{children}</h3>,
  h4: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <h4 {...props}>{children}</h4>,
  p: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <p {...props}>{children}</p>,
  form: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <form {...props}>{children}</form>,
  li: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <li {...props}>{children}</li>,
  ul: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <ul {...props}>{children}</ul>,
  nav: ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }: any) => <nav {...props}>{children}</nav>,
};

export const AnimatePresence = (props: any) => <>{props?.children}</>;
