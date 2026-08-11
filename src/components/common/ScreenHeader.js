import React from 'react';
import TopBar from '../slife/TopBar';

const ScreenHeader = ({ title, onBack, right, overline }) => {
  return <TopBar title={title} onBack={onBack} right={right} overline={overline} />;
};

export default ScreenHeader;
