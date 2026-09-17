import React, { createContext, useState, useContext } from 'react';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [productData, setProductData] = useState(null);
  const [productImage, setProductImage] = useState(null);

  const saveProduct = (data, imageUri) => {
    setProductData(data);
    setProductImage(imageUri);
  };

  const clearProduct = () => {
    setProductData(null);
    setProductImage(null);
  };

  const value = {
    productData,
    productImage,
    saveProduct,
    clearProduct,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProduct = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
};

