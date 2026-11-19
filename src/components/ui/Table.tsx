
import type { ReactNode } from 'react';

export interface TableColumn<T> {
    key: keyof T;
    header: string;
    render?: (row: T) => ReactNode;
}

export interface TableProps<T> {
    columns: TableColumn<T>[];
    data: T[];
    getRowKey?: (row: T) => string | number;
    emptyMessage?: string;
    className?: string;
}

export function Table<T extends object>({
    columns,
    data,
    getRowKey,
    emptyMessage = 'No data available.',
    className = '',
}: TableProps<T>) {
    return (
        <div className={`w-full overflow-x-auto ${className}`}>
            <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-surface-subtle text-text-secondary">
                <tr>
                    {columns.map((column) => (
                    <th
                        key={String(column.key)}
                        scope="col"
                        className="whitespace-nowrap px-4 py-3 font-medium"
                    >
                        {column.header}
                    </th>
                    ))}
                </tr>
            </thead>

        <tbody className="divide-y divide-border-default">
            {data.length === 0 ? (
                <tr>
                    <td
                        colSpan={columns.length}
                        className="px-4 py-8 text-center text-text-muted"
                    >
                        {emptyMessage}
                    </td>
                </tr>
            ) : (
            data.map((row, index) => (
                <tr
                    key={getRowKey ? getRowKey(row) : index}
                    className="hover:bg-surface-hover"
                >
                    {columns.map((column) => (
                    <td
                        key={String(column.key)}
                        className="px-4 py-3 align-middle text-text-secondary"
                    >
                        {column.render
                        ? column.render(row)
                        : String(row[column.key] ?? '')}
                    </td>
                    ))}
                </tr>
            ))
            )}
        </tbody>
        </table>
    </div>
    );
}
