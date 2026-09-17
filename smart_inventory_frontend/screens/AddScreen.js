import React from 'react';
import AddScanScreen from './AddScanScreen';

export default function AddScreen(props) {
  // Wrapper screen – for now it only shows the scan content.
  // Later you can add step1/step3 logic here and still reuse AddScanScreen.
  return <AddScanScreen {...props} />;
}


