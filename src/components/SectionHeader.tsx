/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  onViewAll?: () => void;
}

export default function SectionHeader({ title, icon, onViewAll }: SectionHeaderProps) {
  return (
    <div className="section-head">
      <div className="flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <h2 className="section-title">{title}</h2>
      </div>
      <button className="view-all" onClick={onViewAll}>
        View All <ChevronRight size={14} />
      </button>
    </div>
  );
}
