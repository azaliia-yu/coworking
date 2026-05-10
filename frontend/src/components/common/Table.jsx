import React from 'react'

const Table = ({ columns, data, loading = false, emptyMessage = 'Нет данных' }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#84d2c5]"></div>
      </div>
    )
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    )
  }
  
  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={col.className}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={col.cellClassName}>
                  {col.render ? col.render(row[col.accessor], row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default Table
