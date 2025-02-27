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
import { Areas, Category, FormSchema, Gender, Languages, StudentProps } from "@/app/schema/types"

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
        area: values.area,
        language: values.language
      });
      setExamData(data.data)
      console.log(JSON.stringify(data.data,null,2));
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
                            <SelectItem value={Category.ExSM}>EX SM</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Area</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Areas.General}>General</SelectItem>
                            <SelectItem value={Areas.NexalArea}>Nexal area</SelectItem>
                            <SelectItem value={Areas.BoaderArea}>Border Area</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paper Language</FormLabel>
                        <Select required onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={Languages.English.toString()}>English</SelectItem>
                            <SelectItem value={Languages.Hindi.toString()}>Hindi</SelectItem>
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
                              <SelectValue placeholder="gender" />
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

