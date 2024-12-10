import React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface MarksAboveData {
    marksAbove70: Record<string, number>;
    marksAbove65: Record<string, number>;
    marksAbove60: Record<string, number>;
    marksAbove55: Record<string, number>;
    marksAbove50: Record<string, number>;
    marksAbove45: Record<string, number>;
    marksAbove40: Record<string, number>;
    marksAbove35: Record<string, number>;
    marksAbove30: Record<string, number>;
    marksAbove20: Record<string, number>;
}

export default function DynamicTopRankersTable({ data }: { data: MarksAboveData }) {
    const markRanges = Object.keys(data) as Array<keyof MarksAboveData>;
    const categories = Array.from(new Set(markRanges.flatMap(range => Object.keys(data[range]))));

    return (
        <div className="w-full">
            <div className="bg-purple-600 text-cyan-50 p-4 text-center text-lg font-medium">
                Category wise Marks
            </div>
            <div className="rounded-lg border overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px] font-bold">Marks</TableHead>
                            {categories.map(category => (
                                <TableHead key={category} className="uppercase font-bold">{category}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {markRanges.map(range => (
                            <TableRow key={range}>
                                <TableCell className="font-medium">{`> ${range.replace('marksAbove', '')}`}</TableCell>
                                {categories.map(category => (
                                    <TableCell key={`${range}-${category}`}>
                                        {data[range][category] || 0}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-4 bg-gray-600 p-4 text-center text-lg font-medium text-white">
                Top Rankers
            </div>
        </div>
    )
}

