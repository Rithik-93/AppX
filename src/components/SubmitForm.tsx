"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import axios from "axios"
import { Loader2 } from "lucide-react"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"
import { RankCard } from "@/components/RankCard"
import { Zone, Category, FormSchema, Gender, StudentProps } from "@/app/schema/types"
import { HorizontalCat } from "@prisma/client"

export default function SubmitForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [examData, setExamData] = useState<StudentProps | null>(null);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      answerKeyUrl: ""
    },
  })

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    console.log("i got submitted ")
    setIsLoading(true);
    try {
      const data = await axios.post(`/api/rank`, {
        answerKeyUrl: values.answerKeyUrl,
        category: values.category,
        gender: values.gender,
        zone: values.zone,
        HorizontalCat: values.HorizontalCat,
        phone: values.phone
      });
      setExamData(data.data)
      console.log(JSON.stringify(data.data, null, 2));
      toast.success("Submitted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while submitting.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8 ">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-purple-900 font-bold">Check Your Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="answerKeyUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Answer Key URL</FormLabel>
                        <FormControl>
                          <Input required placeholder="https://" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} required defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Category.UR}>UR</SelectItem>
                            <SelectItem value={Category.OBC}>OBC</SelectItem>
                            <SelectItem value={Category.EWS}>EWS</SelectItem>
                            <SelectItem value={Category.SC}>SC</SelectItem>
                            <SelectItem value={Category.ST}>ST</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(Zone).map((zone) => (
                              <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select required onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Gender.MALE}>Male</SelectItem>
                            <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="HorizontalCat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horizontal Category</FormLabel>
                        <Select required onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select horizontal category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(HorizontalCat).map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="Enter your phone number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        {examData && <RankCard {...examData} />}
      </div>
    </div>
  )
}

