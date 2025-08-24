// import React from 'react';

// const Skeleton = ({ 
//   variant = 'text', 
//   width, 
//   height, 
//   className = '', 
//   count = 1,
//   circle = false,
//   rounded = 'rounded',
//   animation = 'pulse'
// }) => {
//   const baseClasses = `bg-gray-200 ${rounded} ${animation}`;
  
//   const variants = {
//     text: 'h-4',
//     title: 'h-6',
//     subtitle: 'h-5',
//     avatar: 'w-10 h-10',
//     button: 'h-10 w-24',
//     card: 'h-32',
//     table: 'h-12',
//     form: 'h-10',
//     chart: 'h-48',
//     list: 'h-16',
//     image: 'w-full h-32',
//     badge: 'h-6 w-16',
//     input: 'h-10 w-full',
//     select: 'h-10 w-32',
//     checkbox: 'w-4 h-4',
//     radio: 'w-4 h-4',
//     switch: 'w-12 h-6',
//     progress: 'h-2 w-full',
//     divider: 'h-px w-full',
//     spacer: 'w-full h-4'
//   };

//   const variantClass = variants[variant] || variants.text;
//   let finalClasses = `${baseClasses} ${variantClass} ${className}`;
  
//   if (width) {
//     finalClasses += ` w-${width}`;
//   }
  
//   if (height) {
//     finalClasses += ` h-${height}`;
//   }
  
//   if (circle) {
//     finalClasses += ' rounded-full';
//   }

//   if (count === 1) {
//     return (
//       <div 
//         className={finalClasses}
//         style={{
//           width: width,
//           height: height
//         }}
//       />
//     );
//   }

//   return (
//     <div className="space-y-2">
//       {Array.from({ length: count }).map((_, index) => (
//         <div 
//           key={index}
//           className={finalClasses}
//           style={{
//             width: width,
//             height: height
//           }}
//         />
//       ))}
//     </div>
//   );
// };

// // Specific skeleton components for common use cases
// export const SkeletonText = ({ lines = 3, className = '' }) => (
//   <div className={`space-y-2 ${className}`}>
//     {Array.from({ length: lines }).map((_, index) => (
//       <Skeleton 
//         key={index} 
//         variant="text" 
//         width={index === lines - 1 ? '75%' : '100%'} 
//       />
//     ))}
//   </div>
// );

// export const SkeletonCard = ({ className = '' }) => (
//   <div className={`p-4 bg-white rounded-lg shadow-sm border ${className}`}>
//     <div className="space-y-3">
//       <Skeleton variant="title" width="60%" />
//       <Skeleton variant="text" width="100%" />
//       <Skeleton variant="text" width="80%" />
//       <div className="flex space-x-2">
//         <Skeleton variant="badge" />
//         <Skeleton variant="badge" />
//       </div>
//     </div>
//   </div>
// );

// export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
//   <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
//     <div className="p-4 border-b">
//       <Skeleton variant="title" width="40%" />
//     </div>
//     <div className="divide-y">
//       {Array.from({ length: rows }).map((_, rowIndex) => (
//         <div key={rowIndex} className="p-4 flex space-x-4">
//           {Array.from({ length: columns }).map((_, colIndex) => (
//             <Skeleton 
//               key={colIndex} 
//               variant="text" 
//               width={colIndex === 0 ? '20%' : '15%'} 
//             />
//           ))}
//         </div>
//       ))}
//     </div>
//   </div>
// );

// export const SkeletonForm = ({ fields = 6, className = '' }) => (
//   <div className={`max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}>
//     <Skeleton variant="title" width="50%" className="mb-6" />
//     <div className="space-y-6">
//       {Array.from({ length: fields }).map((_, index) => (
//         <div key={index} className="space-y-2">
//           <Skeleton variant="text" width="30%" />
//           <Skeleton variant="input" />
//         </div>
//       ))}
//     </div>
//     <div className="flex justify-end pt-6">
//       <Skeleton variant="button" />
//     </div>
//   </div>
// );

// export const SkeletonChart = ({ className = '' }) => (
//   <div className={`p-4 bg-white rounded-lg shadow-sm border ${className}`}>
//     <Skeleton variant="title" width="40%" className="mb-4" />
//     <Skeleton variant="chart" />
//     <div className="flex justify-between mt-4">
//       <Skeleton variant="badge" />
//       <Skeleton variant="badge" />
//       <Skeleton variant="badge" />
//     </div>
//   </div>
// );

// export const SkeletonList = ({ items = 4, className = '' }) => (
//   <div className={`space-y-3 ${className}`}>
//     {Array.from({ length: items }).map((_, index) => (
//       <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
//         <Skeleton variant="avatar" circle />
//         <div className="flex-1 space-y-2">
//           <Skeleton variant="text" width="60%" />
//           <Skeleton variant="text" width="40%" />
//         </div>
//         <Skeleton variant="badge" />
//       </div>
//     ))}
//   </div>
// );

// export const SkeletonGrid = ({ items = 6, columns = 3, className = '' }) => (
//   <div className={`grid gap-4 ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
//     {Array.from({ length: items }).map((_, index) => (
//       <SkeletonCard key={index} />
//     ))}
//   </div>
// );

// export default Skeleton;
