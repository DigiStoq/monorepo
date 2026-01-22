import { motion } from "framer-motion";
import { listContainerVariants, listItemVariants } from "@/lib/animations";
import { cn } from "@/lib/cn";

interface AnimatedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  itemClassName?: string;
}

export function AnimatedList<T>({
  items,
  renderItem,
  keyExtractor,
  className,
  itemClassName,
}: AnimatedListProps<T>): React.ReactNode {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={listContainerVariants}
      className={className}
    >
      {items.map((item, index) => (
        <motion.div
          key={keyExtractor(item, index)}
          variants={listItemVariants}
          className={cn(itemClassName)}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  );
}
