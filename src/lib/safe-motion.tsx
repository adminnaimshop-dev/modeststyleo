import React from 'react';

/**
 * Universal Motion Fallback Proxy
 * Dynamically handles ANY HTML tag (div, section, img, a, button, tr, td, etc.)
 * so motion components will never return undefined or crash React rendering.
 */

const createMotionComponent = (TagName: string) => {
  const MotionComponent = React.forwardRef<any, any>(({
    children,
    initial,
    animate,
    exit,
    transition,
    whileHover,
    whileTap,
    whileFocus,
    whileInView,
    viewport,
    variants,
    layout,
    layoutId,
    ...props
  }, ref) => {
    return React.createElement(TagName, { ref, ...props }, children);
  });
  MotionComponent.displayName = `motion.${TagName}`;
  return MotionComponent;
};

export const motion: any = new Proxy({}, {
  get: (_target, prop: string) => {
    return createMotionComponent(prop);
  }
});

export const AnimatePresence = ({ children }: any) => <>{children}</>;
