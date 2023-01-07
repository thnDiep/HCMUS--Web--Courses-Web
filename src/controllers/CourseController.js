import courseModel from "../models/courseModel.js";
import categoryModel from "../models/categoryModel.js";
import userModel from "../models/userModel.js";
import moment from "moment/moment.js";

const computeMaxPage = function (limit, total) {
  let maxPage = Math.floor(total / limit);
  if (total % limit) maxPage++;
  return maxPage;
};

const computePageNumbers = function (currentPage, maxPage) {
  const pageNumbers = [];
  if (maxPage !== 1) {
    for (let i = 1; i <= maxPage; i++) {
      if (i === currentPage) {
        pageNumbers.push({ value: i, isActive: true });
      } else {
        pageNumbers.push({ value: i });
      }
    }
  }

  return pageNumbers;
};

export const searchOptions = [
  { value: 0, name: "Search by Name" },
  { value: 1, name: "Search by Category" },
];

class CourseController {
  // [GET] /courses?id=
  async index(req, res) {
    const id = parseInt(req.query.id) || 1;

    const limit = 8;
    const totalCourses = await courseModel.countByCategoryId(id);
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const maxPage = computeMaxPage(limit, totalCourses);
    const pageNumbers = computePageNumbers(page, maxPage);

    const category = await categoryModel.getById(id);
    const courses = await courseModel.getPageByCategoryId(id, limit, offset);
    const allCategories = await categoryModel.getAllWithHierarchy(id); // use in category side bar
    const isCourse = true;

    await getInfoCourse(courses);

    res.render("courses/index", {
      isCourse,
      category,
      courses,
      allCategories,
      searchOptions,
      isEmpty: courses.length === 0,
      pageInfo: {
        current: page,
        isFirst: page === 1,
        isLast: page === maxPage,
        numbers: pageNumbers,
      },
    });
  }

  // [GET] /courses/detail?id=
  async detail(req, res) {
    const id = parseInt(req.query.id) || 1;
    const limit = 5;
    const totalCourses = await courseModel.countByCategoryId(id);
    let maxPage = Math.floor(totalCourses / limit);
    if (totalCourses % limit) maxPage++;

    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    const pageNumbers = [];
    if (maxPage !== 1) {
      for (let i = 1; i <= maxPage; i++) {
        if (i === page) {
          pageNumbers.push({ value: i, isActive: true });
        } else {
          pageNumbers.push({ value: i });
        }
      }
    }
    const course = await courseModel.getById(id);

    const courseContent = await userModel.getAllCourseOfTeacher(3);
    for (let i = 0; i < courseContent.length; i++) {
      const Rated = await courseModel.getAvgRate(courseContent[i].id);
      const sumRate = await courseModel.getCountFeedback(courseContent[i].id);
      const numberStudent = await userModel.getNumberStudentByCourse(
        courseContent[i].id
      );
      const chapter = await courseModel.getAllChapterOfCourse(
        courseContent[i].id
      );
      for (let i = 0; i < chapter.length; i++) {
        chapter[i].index = i + 1;
        chapter[i].lesson = await courseModel.getAllLessonOfChapter(
          chapter[i].id
        );
        for (let j = 0; j < chapter[i].lesson.length; j++) {
          chapter[i].lesson[j].index = j + 1;
          j === chapter[i].lesson.length - 1 && i === chapter.length - 1
            ? (chapter[i].lesson[j].checkLesson = true)
            : (chapter[i].lesson[j].checkLesson = false);
        }
        i === chapter.length - 1 && chapter[i].lesson.length === 0
          ? (chapter[i].checkChapter = true)
          : (chapter[i].checkChapter = false);
        i === chapter.length - 1
          ? (chapter[i].check = true)
          : (chapter[i].check = false);
      }
      courseContent[i].chapter = chapter;
      courseContent[i].rated = (+Rated).toFixed(1);
      courseContent[i].sumRate = (+sumRate).toFixed(0);
      courseContent[i].numberStudent = (+numberStudent).toFixed(0);
      courseContent[i].index = i + 1;
    }

    const avgRated = await courseModel.getAvgRate(course.id);
    course.rated = (+avgRated).toFixed(1);

    const numberRated = await courseModel.getCountFeedback(course.id);
    course.numberRated = (+numberRated).toFixed(0);

    const isComplete = await courseModel.isComplete(id);
    const teacher = await courseModel.teacherOfCourse(id);
    const numberOfStudent = await userModel.getNumberStudentByCourse(id);
    const updateTime = await courseModel.getUpdateTime(id);
    const numberStudentOfTeacher = await userModel.getNumberStudentOfTeacher(
      id
    );
    const NumberCourseOfTeacher = await userModel.getNumberCourseOfTeacher(id);
    const listSimilarCourse = await courseModel.getSimilarCourse(id);
    const listSimilar = [];
    for (const course of listSimilarCourse) {
      if (course.id !== id) {
        listSimilar.push(course);
      }
    }

    const numberRating = await courseModel.getCountFeedback(id);

    const percent_5star = await courseModel.percent_star(id, 5);
    const percent_4star = await courseModel.percent_star(id, 4);
    const percent_3star = await courseModel.percent_star(id, 3);
    const percent_2star = await courseModel.percent_star(id, 2);
    const percent_1star = await courseModel.percent_star(id, 1);

    const percentInfo = [
      {
        index: 5,
        percent: percent_5star,
      },
      {
        index: 4,
        percent: percent_4star,
      },
      {
        index: 3,
        percent: percent_3star,
      },
      {
        index: 2,
        percent: percent_2star,
      },
      {
        index: 1,
        percent: percent_1star,
      },
    ];
    const allFeedback = await courseModel.getAllFeedback(id);
    // const feedbackTime = await courseModel.getTimeOfFeedback(id);
    // console.log(feedbackTime);

    // const timeOfFeedback = await courseModel.convertFormatDate(allFeedback.time);
    allFeedback.forEach((feedback) => {
      const time = moment(feedback.time).format("MM/DD/YYYY HH:mm:ss");
      feedback.time = time;
    });

    if (course === null) {
      res.redirect("/courses");
    }
    await courseModel.updateView(id);
    const isCourse = true;

    const category = await categoryModel.getById(course.idCategory);
    const linkCategories = [];
    if (category.parentID !== null) {
      const parentCategory = await categoryModel.getById(category.parentID);
      linkCategories.push(parentCategory);
    }
    linkCategories.push(category);
    // console.log(linkCategories);

    // course.linkCategories = linkCategories;

    res.render("courses/courseDetail", {
      course,
      courseContent,
      isCourse,
      isComplete,
      teacher,
      numberOfStudent,
      updateTime,
      numberStudentOfTeacher,
      NumberCourseOfTeacher,
      listSimilar,
      linkCategories,
      numberRating,
      percentInfo,
      allFeedback,
      pageInfo: {
        current: page,
        isFirst: page === 1,
        isLast: page === maxPage,
        numbers: pageNumbers,
      },
      searchOptions,
      // feedbackTime,
      // timeOfFeedback,
    });
  }

  // [GET] /courses/join?id=
  async join(req, res) {
    const id = parseInt(req.query.id) || 1;
    const course = await courseModel.join(id);

    if (course === null) {
      res.redirect("/courses");
    }
    const isCourse = true;

    await courseModel.updateView(id);
    res.render("courses/enrollCourse", {
      isCourse,
      course,
      searchOptions,
    });
  }

  // [GET] /courses/search?keyword=
  async search(req, res) {
    const limit = 3;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;
    let totalResult;

    const keyWord = req.query.keyword || "";
    let searchOption = 0;
    let courses;

    if (req.query.searchBy) {
      searchOption = parseInt(req.query.searchBy);
    }

    searchOptions.forEach((option) => {
      if (option.value === searchOption) {
        option.isSelected = true;
      } else {
        option.isSelected = false;
      }
    });

    switch (searchOption) {
      case 0:
        totalResult = await courseModel.totalResultByName(keyWord);
        courses = await courseModel.searchPageByName(keyWord, limit, offset);
        break;
      case 1:
        totalResult = await courseModel.totalResultByCategory(keyWord);
        courses = await courseModel.searchPageByCategory(
          keyWord,
          limit,
          offset
        );
        break;
      default:
        courses = null;
        break;
    }

    const maxPage = computeMaxPage(limit, totalResult);
    const pageNumbers = computePageNumbers(page, maxPage);

    if (courses !== null) {
      await getInfoCourse(courses);
    }

    const isCourse = true;
    res.render("courses/search", {
      keyWord,
      searchOption,
      searchOptions,
      courses,
      totalResult,
      isEmpty: totalResult === 0,
      pageInfo: {
        current: page,
        isFirst: page === 1,
        isLast: page === maxPage,
        numbers: pageNumbers,
      },
      isCourse,
    });
  }
}

const getInfoCourse = async function (courses) {
  // Lấy 5 khóa học bán chạy nhất trong các khóa học
  const bestSellerCourses = await courseModel.getBestSellerList(5);
  const trendingCourses = await courseModel.getTrendingList(5);

  for (const course of courses) {
    // Lấy trung bình rating của khóa học
    const avgRated = await courseModel.getAvgRate(course.id);
    course.rated = (+avgRated).toFixed(1);

    // Lấy số lượng feedback của khóa học
    const numberRated = await courseModel.getCountFeedback(course.id);
    course.numberRated = (+numberRated).toFixed(0);

    // Lấy tên teacher của khóa học
    const teacher = await userModel.getNameTeacher(course.id);
    course.teacher = teacher;

    // Lấy category của khóa học
    const category = await categoryModel.getById(course.idCategory);

    // Lấy đường dẫn category của khóa học (nếu khóa học thuộc category cấp lĩnh vực 2)
    const linkCategories = [];
    if (category.parentID !== null) {
      const parentCategory = await categoryModel.getById(category.parentID);
      linkCategories.push(parentCategory);
    }
    linkCategories.push(category);
    course.linkCategories = linkCategories;

    // Khóa học nổi bật (được đánh giá nhiều nhất)
    trendingCourses.forEach((element) => {
      if (element.id === course.id) {
        course.trending = true;
      }
    });

    // Khóa học có khuyến mại
    if (course.fee !== course.feeO) {
      course.discount = true;
    }

    // Khóa học nằm trong top 5 khóa học bán chạy nhất
    bestSellerCourses.forEach((element) => {
      if (element.id === course.id) {
        course.bestSeller = true;
      }
    });

    // Khóa học mới được thêm trong 7 ngày
    const now = moment();
    const createTime = moment(course.createTime);
    if (now.diff(createTime, "days") < 7) {
      course.new = true;
    }
  }
};

export default new CourseController();
