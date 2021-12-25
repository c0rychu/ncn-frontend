import { React, useRef, forwardRef, useEffect,useState } from 'react';
import {arrayMoveImmutable as arrayMove} from 'array-move';
import "./CourseTableCard.css";
import {
    Flex,
    Text,
    Box,
    Button,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DrawerHeader,
    DrawerBody,
    DrawerFooter,
    useDisclosure,
    Tooltip,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody,
    Badge,
    ButtonGroup,
    PopoverFooter,
    Spacer,
    IconButton
} from '@chakra-ui/react';
import { hash_to_color_hex, random_color_hex } from '../utils/colorAgent';
import {sortableContainer, sortableElement, sortableHandle} from 'react-sortable-hoc';
import { FaBars, FaTrashAlt, FaInfoCircle } from 'react-icons/fa';
import {RenderNolContentBtn} from '../containers/CourseDrawerContainer';



function CourseTableCard(props){
    const { isOpen, onOpen, onClose } = useDisclosure()
    const [ courseOrder, setCourseOrder ] = useState(props.courseTime);
    const [ courseList, setCourseList ] = useState([]);
    const DragHandle = sortableHandle(() => <FaBars />);
    const SortableElement = sortableElement(({course}) => (
      <Flex className="sortableHelper" alignItems="center" my="1">
        <DragHandle/>
        <Badge ml="4" mr="1" variant="solid" bg={hash_to_color_hex(course._id, 0.9)} color="gray.600">{course.id}</Badge>
        <Text fontSize="lg" color="gray.500" mx="1" fontWeight="700" isTruncated>{course.course_name}</Text>
            {RenderNolContentBtn(course, "")}
        <Spacer/>
        <IconButton aria-label='Delete' icon={<FaTrashAlt />} size="sm" colorScheme="red"/>
      </Flex>
    ));
    const SortableContainer = sortableContainer(({children}) => {
      return <Flex flexDirection="column">{children}</Flex>;
    });
    const onSortEnd = ({oldIndex, newIndex}) => {
        setCourseList(arrayMove(courseList, oldIndex, newIndex));
    };
    const renderPopoverBody = (courseData) => {
        return(
            <SortableContainer useDragHandle onSortEnd={onSortEnd} lockAxis="y">
                {courseList.map((courseId, index) => {
                    let course = courseData[courseId];
                    return(
                        <SortableElement key={courseId} index={index} course={course} helperClass="sortableHelper"/>
                    );
                })}
            </SortableContainer>
        );
    };
    const renderCourseBox = (courseId, courseData) => {
        const course = courseData[courseId];
        return (
        <>
            <Tooltip label={course.course_name} placement="top" hasArrow >
                <Button as="Button" onClick={() => {setCourseList(courseOrder)}} bg={hash_to_color_hex(course._id, isOpen ? 0.7:0.8)} borderRadius="lg" boxShadow="lg" p="2" w="4vw" mb="1">
                    <Text fontSize="2" isTruncated> {course.course_name} </Text>
                </Button>
            </Tooltip>
        </>
        );
    };
    return(
    <>
        <Popover onOpen={onOpen} onClose={onClose} isOpen={isOpen} closeOnBlur={false} placement="left">
            <PopoverTrigger>
                <Box>
                    {courseOrder.map(courseId => {
                        return renderCourseBox(courseId, props.courseData);
                    })}
                </Box>
            </PopoverTrigger>
                <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>
                        <Flex flexDirection="row" alignItems="center" justifyContent="start" mb="2">
                            節次資訊
                            <Badge ml="2" size="sm">週Ｘ第Ｘ節</Badge>
                        </Flex>
                    </PopoverHeader>
                    <PopoverBody>
                    <Flex flexDirection="column" justifyContent="center">
                        {renderPopoverBody(props.courseData)}
                    </Flex>
                    </PopoverBody>
                    <PopoverFooter>
                        <Flex justifyContent="end">
                            <Button colorScheme='gray' variant="ghost" onClick={onClose}>取消</Button>
                            <Button colorScheme='teal' onClick={() => {onClose(); setCourseOrder(courseList)}}>儲存</Button>
                        </Flex>
                    </PopoverFooter>
                </PopoverContent>
        </Popover>
    </>
    );
}
export default CourseTableCard;