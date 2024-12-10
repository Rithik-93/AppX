import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ScoreCardProps {
    name: string
    category: string
    examDate: string
    examTime: string
    totalMarks: number
    //   normalizedMarks: number
    rawRank: number
    //   normalizedRank: number
    subjectData: {
        attempted: number
        notAttempted: number
        correct: number
        wrong: number
        totalMarks: number
    }
}

export default function ScoreCard({
    name,
    category,
    examDate,
    examTime,
    totalMarks,
    //   normalizedMarks,
    rawRank,
    //   normalizedRank,
    subjectData,
}: ScoreCardProps) {

    subjectData.wrong = (subjectData.attempted + subjectData.notAttempted) - subjectData.correct
    
    return (
        <Card className="w-[600px] p-6 space-y-6">
            <div className="bg-primary text-primary-foreground p-4 -mx-6 -mt-6 rounded-t-lg">
                <h1 className="text-xl font-semibold">
                    ALP Stage 1 Scorecard <span className="text-blue-300 text-sm">(Total Students: 61,288)</span>
                </h1>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: "Name", value: name },
                    { label: "Category", value: category },
                    { label: "Exam Date", value: examDate },
                    { label: "Exam Time", value: examTime },
                    { label: "Total Marks", value: totalMarks },
                    { label: "Raw Rank", value: rawRank }
                ].map((item, index) => (
                    <div key={index}>
                        <p className="font-medium text-muted-foreground">{item.label}</p>
                        <p className="font-semibold">{item.value}</p>
                    </div>
                ))}
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[180px]">Subject</TableHead>
                        <TableHead className="text-center">Attem.</TableHead>
                        <TableHead className="text-center">Not Attem.</TableHead>
                        <TableHead className="text-center">R</TableHead>
                        <TableHead className="text-center">W</TableHead>
                        <TableHead className="text-center">Marks</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>Subject-1</TableCell>
                        <TableCell className="text-center">{subjectData.attempted}</TableCell>
                        <TableCell className="text-center">{subjectData.notAttempted}</TableCell>
                        <TableCell className="text-center">{subjectData.correct}</TableCell>
                        <TableCell className="text-center">{subjectData.wrong}</TableCell>
                        <TableCell className="text-center">{subjectData.totalMarks}</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary text-primary-foreground font-medium">
                        <TableCell>Overall</TableCell>
                        <TableCell className="text-center">{subjectData.attempted}</TableCell>
                        <TableCell className="text-center">{subjectData.notAttempted}</TableCell>
                        <TableCell className="text-center">{subjectData.correct}</TableCell>
                        <TableCell className="text-center">{subjectData.wrong}</TableCell>
                        <TableCell className="text-center">{subjectData.totalMarks}</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Card>
    )
}

