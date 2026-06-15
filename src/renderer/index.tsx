import React from 'react';
import { createRoot } from 'react-dom/client';
import VeilConnectApp from './VeilConnectApp';
import './VeilConnectApp.css';

console.log('✅ 开始加载VeilConnect桌面版应用...');

// 确保DOM已加载
document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    console.log('✅ 找到root元素，开始渲染VeilConnectApp...');
    
    const root = createRoot(rootElement);
    root.render(<VeilConnectApp />);
    
    console.log('✅ VeilConnectApp渲染完成');
  } else {
    console.error('❌ 找不到root元素');
  }
});

// 如果DOM已经加载完成，直接执行
if (document.readyState === 'loading') {
  // DOM还在加载中，等待DOMContentLoaded事件
  console.log('⏳ DOM正在加载中...');
} else {
  // DOM已经加载完成
  console.log('✅ DOM已加载完成，直接执行渲染');
  const rootElement = document.getElementById('root');
  
  if (rootElement) {
    console.log('✅ 找到root元素，开始渲染VeilConnectApp...');
    
    const root = createRoot(rootElement);
    root.render(<VeilConnectApp />);
    
    console.log('✅ VeilConnectApp渲染完成');
  } else {
    console.error('❌ 找不到root元素');
  }
} 