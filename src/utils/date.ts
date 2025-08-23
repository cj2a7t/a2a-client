import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

// 扩展 dayjs 以支持相对时间功能
dayjs.extend(relativeTime);

/**
 * 格式化时间为 "MM/DD/YYYY HH:mm" 格式
 * @param date 日期对象或日期字符串
 * @returns 格式化后的时间字符串
 */
export const formatTime = (date: Date | string): string => {
  return dayjs(date).format('MM/DD/YYYY HH:mm');
};

/**
 * 格式化时间为相对时间（如：刚刚、5分钟前、1小时前等）
 * @param date 日期对象或日期字符串
 * @returns 相对时间字符串
 */
export const formatRelativeTime = (date: Date | string): string => {
  return dayjs(date).fromNow();
};

/**
 * 格式化时间为简短格式（如：今天 HH:mm、昨天 HH:mm、MM/DD HH:mm）
 * @param date 日期对象或日期字符串
 * @returns 简短格式的时间字符串
 */
export const formatShortTime = (date: Date | string): string => {
  const now = dayjs();
  const targetDate = dayjs(date);
  
  if (targetDate.isSame(now, 'day')) {
    return `今天 ${targetDate.format('HH:mm')}`;
  } else if (targetDate.isSame(now.subtract(1, 'day'), 'day')) {
    return `昨天 ${targetDate.format('HH:mm')}`;
  } else if (targetDate.isSame(now, 'year')) {
    return targetDate.format('MM/DD HH:mm');
  } else {
    return targetDate.format('YYYY/MM/DD HH:mm');
  }
}; 