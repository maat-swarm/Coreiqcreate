import React from 'react';
import { SiteVisualEnvironment } from '../environment/SiteVisualEnvironment';
import { NavRoute } from '../../types';

interface AmbientBackgroundProps {
  currentRoute?: NavRoute;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ currentRoute = 'home' }) => {
  return <SiteVisualEnvironment currentRoute={currentRoute} />;
};
