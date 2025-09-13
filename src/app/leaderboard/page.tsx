// src/app/leaderboard/page.tsx
import Header from '@/components/app/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getLeaderboardData } from '@/services/firestore';
import { Award, Medal, Trophy } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-yellow-700" />;
    return <span className="font-bold">{rank}</span>;
};

export default async function LeaderboardPage() {
    const leaderboard = await getLeaderboardData();

    return (
        <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline text-3xl">Global Leaderboard</CardTitle>
                        <CardDescription>
                            See how you stack up against other aspirants. Your total score is the sum of scores from all exams you've taken.
                            <br />
                            <span className="font-semibold text-primary">Scoring Formula:</span> (Correct × Marks) − (Wrong × Penalty). Unattempted questions do not affect your score.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16 text-center">Rank</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead className="text-center">Exams Taken</TableHead>
                                        <TableHead className="text-right">Total Coins</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {leaderboard.map((user, index) => (
                                        <TableRow key={user.uid} className={index < 3 ? 'bg-secondary' : ''}>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center">
                                                    <RankIcon rank={index + 1} />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{user.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">{user.examsTaken}</TableCell>
                                            <TableCell className="text-right font-bold text-primary">{user.totalPoints.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                         {leaderboard.length === 0 && (
                            <div className="py-10 text-center text-muted-foreground">
                                No user data available to build the leaderboard yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
