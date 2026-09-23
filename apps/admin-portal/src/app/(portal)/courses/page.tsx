import { PageHeader } from "@/components/layout/PageHeader";
import { CourseOutlineHub } from "@/components/courses/CourseOutlineHub";
import {
  getClasses,
  getCourseOutlines,
  getCourseVouchers,
  getInventoryItems,
  getParentsByIds,
  getStockLevels,
  getStudents,
} from "@/lib/mock-service";

export default async function CourseOutlinePage() {
  const [courses, vouchers, students, classes, items, stock] = await Promise.all([
    getCourseOutlines(),
    getCourseVouchers(),
    getStudents(),
    getClasses(),
    getInventoryItems(),
    getStockLevels(),
  ]);
  const parents = await getParentsByIds(Array.from(new Set(students.flatMap((s) => s.parentIds))));

  return (
    <>
      <PageHeader
        title="Course Outline & Syllabus"
        subtitle="Session-wise course outlines · required books & copies · course vouchers · course inventory"
      />
      <CourseOutlineHub
        courses={courses}
        vouchers={vouchers}
        students={students}
        parents={parents}
        classes={classes.map((c) => ({ id: c.id, classGroup: c.classGroup }))}
        items={items}
        stock={stock}
      />
    </>
  );
}
