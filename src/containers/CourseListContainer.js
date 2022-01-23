import { React, useEffect, useState } from 'react';
import "../components/CourseTableCard.css";
import {arrayMoveImmutable as arrayMove} from 'array-move';
import {
    Flex,
    Text,
    Button,
    IconButton,
    Badge,
    Tag,
    useToast,
    ScaleFade,
    TagLeftIcon,
    Spacer,
} from '@chakra-ui/react';
import {
    FaPlus,
    FaTrash,
    FaExclamationTriangle,
} from 'react-icons/fa';

import {MdDragHandle} from 'react-icons/md';
import { patchCourseTable } from '../actions/index';
import { hash_to_color_hex } from '../utils/colorAgent';
import { genNolAddUrl, openPage } from './CourseDrawerContainer';
import { useDispatch } from 'react-redux';
import {sortableContainer, sortableElement, sortableHandle} from 'react-sortable-hoc';

function CourseListContainer({ courseTable, courses }) {
  
  const dispatch = useDispatch();
  const toast = useToast();
  const [ courseListForSort, setCourseListForSort ] = useState(Object.keys(courses));
  const [ prepareToRemoveCourseId, setPrepareToRemoveCourseId ] = useState([]);
  const [ isLoading, setIsLoading ] = useState(false);
  
  useEffect(() => {
    setCourseListForSort(Object.keys(courses));
  } , [courses]);
  
  const handleDelete = (courseId) => {
    if (prepareToRemoveCourseId.includes(courseId)){
        // If the course is in the prepareToRemoveCourseId, remove it from the list.
        setPrepareToRemoveCourseId(prepareToRemoveCourseId.filter(id => id!==courseId));
    }else{
        // If the course is not in the prepareToRemoveCourseId, add it to the list.
        setPrepareToRemoveCourseId([...prepareToRemoveCourseId, courseId])
    }
  };

  const handleSaveCourseTable = async() => {
    setIsLoading(true);
    try{
      setCourseListForSort(courseListForSort.filter(id => !prepareToRemoveCourseId.includes(id)));
      const res_table = await dispatch(patchCourseTable(courseTable._id, courseTable.name, courseTable.user_id, courseTable.expire_ts, courseListForSort));
      if(res_table){
        toast({
          title: "編輯課表成功",
          description: "志願序更動已儲存",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    }catch(err){
      toast({
        title: `編輯課表失敗`,
        description: `請稍後再試`,
        status: 'error',
        duration: 3000,
        isClosable: true
      });
    }
    setIsLoading(false);
  }

  const isEdited = () => {
    // return true if the popup data is different from the original data.
    return !(courseListForSort.every((course, index) => course === Object.keys(courses)[index])) || prepareToRemoveCourseId.length > 0;
}

  const DragHandle = sortableHandle(() => <MdDragHandle cursor="row-resize" size="20" color="gray"/>);
  const SortableElement = sortableElement(({key, course, courseIdx}) => (
    <Flex key={key} flexDirection="row" justifyContent="center" alignItems="center" h="100%" w="100%" py="2" px="2" bg="gray.100" my="1" borderRadius="lg" zIndex="1000">
      <Flex flexDirection="row" justifyContent="start" alignItems="center" h="100%" w="100%">
        <DragHandle key={"Sortable_"+key+"_DragHandle"}/>
        <Tag size="lg" key={key} variant='solid' bg={hash_to_color_hex(course._id, 0.8)} mx="2"><Text fontWeight="800" color="gray.700">{courseIdx + 1}</Text></Tag>
        <Badge colorScheme="blue" size="lg" mx="2">{course.id}</Badge>
        <Text as={prepareToRemoveCourseId.includes(course._id) ? "del":""} color={prepareToRemoveCourseId.includes(course._id) ? "red.700":"gray.500"} fontSize="xl" fontWeight="bold">{course.course_name}</Text>
      </Flex>
      <Flex ml="4" flexDirection="row" justifyContent="end" alignItems="center">
        <Button mx="2" size="sm" variant="ghost" colorScheme="blue" leftIcon={<FaPlus/>} onClick={() => openPage(genNolAddUrl(course), true)}>課程網</Button>
        <IconButton aria-label='Delete' variant={prepareToRemoveCourseId.includes(course._id) ? "solid":"outline"} icon={<FaTrash />} size="sm" colorScheme="red" key={key} onClick={() => {handleDelete(course._id)}}/>
      </Flex>
    </Flex>
  ));

  const SortableContainer = sortableContainer(({children}) => {
    return <Flex flexDirection="column">{children}</Flex>;
  });
  const onSortEnd = ({oldIndex, newIndex}) => {
    setCourseListForSort(arrayMove(courseListForSort, oldIndex, newIndex));
  };

  return(
    <>
      <Flex flexDirection="row" justifyContent="start" alignItems="center" w="100%" py="2" px="2">
        <Text fontSize="md" fontWeight="bold" color="gray.600">已選 {courseListForSort.length} 課程</Text>
        <Button ml="4" size="xs" variant="ghost" colorScheme="blue" leftIcon={<FaPlus/>} disabled>
          批次加入課程網 <Text ml="1" as='sup' color="gray.500" fontWeight="500" style={{fontStyle: "italic"}}>coming soon</Text>
        </Button>
        <Spacer />
        <ScaleFade initialScale={0.9} in={isEdited()}>
          <Tag colorScheme="yellow" variant="solid" >
            <TagLeftIcon boxSize='12px' as={FaExclamationTriangle} />
            變更未儲存
          </Tag>
        </ScaleFade>
        <Button ml="2" size="sm" variant="ghost" colorScheme="blue" disabled={!isEdited()} onClick={() => {setCourseListForSort(Object.keys(courses)); setPrepareToRemoveCourseId([]);}}>重設</Button>
        <Button ml="2" size="sm" variant="solid" colorScheme="teal" disabled={!isEdited()} onClick={() => {handleSaveCourseTable();}} isLoading={isLoading}>套用</Button>
      </Flex>
      <SortableContainer onSortEnd={onSortEnd} lockAxis="y" useDragHandle>
        {
            courseListForSort.map((key, index) => {
            const course = courses[key];
            return(
              <SortableElement key={key} index={index} course={course} courseIdx={index} helperClass="sortableHelper"/>
            );
          })
        }
      </SortableContainer>
    </>
  );
}

export default CourseListContainer;