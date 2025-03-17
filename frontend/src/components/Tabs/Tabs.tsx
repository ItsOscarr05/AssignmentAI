import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { tabs } from './Tabs.css';

interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export function Tabs({ tabs: tabList, defaultTab, onChange }: TabsProps) {
  const [selectedTab, setSelectedTab] = useState(defaultTab || tabList[0]?.id);

  const handleTabChange = (tabId: string) => {
    setSelectedTab(tabId);
    onChange?.(tabId);
  };

  return (
    <div>
      <div className={tabs.list} role="tablist">
        {tabList.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={selectedTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={tabs.trigger({ selected: selectedTab === tab.id })}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        {tabList.map(
          (tab) =>
            selectedTab === tab.id && (
              <motion.div
                key={tab.id}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                id={`panel-${tab.id}`}
                className={tabs.content}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {tab.content}
              </motion.div>
            )
        )}
      </AnimatePresence>
    </div>
  );
} 