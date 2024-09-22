import React from 'react';

const ProductList = ({ products, onProductSelect }) => {
  return (
    <div>
      <h2>Available Products</h2>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            <span>{product.name} - ${product.price.toFixed(2)}</span>
            <button onClick={() => onProductSelect(product.id, product.price)}>Add</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
