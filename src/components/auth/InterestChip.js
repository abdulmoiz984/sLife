import React from 'react';
import Chip from '../slife/Chip';

const InterestChip = ({ label, selected, onPress }) => {
  return <Chip label={label} active={selected} onPress={onPress} />;
};

export default InterestChip;
