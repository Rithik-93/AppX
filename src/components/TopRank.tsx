import { MarksAboveData } from '@/app/types'
import DynamicTopRankersTable from './TopRankers'

export default function TopRankers({ data }: { data: MarksAboveData }) {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6 text-purple-900">Top Rankers Table</h1>
            <DynamicTopRankersTable data={data} />
        </div>
    )
}

