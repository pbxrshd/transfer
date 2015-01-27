#!/usr/bin/env python

import cv

class Target:

	def __init__(self):
		self.capture = cv.CaptureFromCAM(0)
		cv.NamedWindow("Target", 1)

	def run(self):
		image = None
		MAX_COUNT = 500
		win_size = (32, 32)
		line_draw = 2
		frame = cv.QueryFrame(self.capture)
		image = cv.CreateImage(cv.GetSize(frame), 8, 3)
		image.origin = frame.origin
		grey = cv.CreateImage(cv.GetSize(frame), 8, 1)
		edges = cv.CreateImage(cv.GetSize(frame), 8, 1)
		prev_grey = cv.CreateImage(cv.GetSize(frame), 8, 1)
		prev_grey2 = cv.CreateImage(cv.GetSize(frame), 8, 1)
		prev_grey3 = cv.CreateImage(cv.GetSize(frame), 8, 1)
		pyramid = cv.CreateImage(cv.GetSize(frame), 8, 1)
		prev_pyramid = cv.CreateImage(cv.GetSize(frame), 8, 1)
		points = []
		prev_points = []
		count = 0
		criteria = (cv.CV_TERMCRIT_ITER|cv.CV_TERMCRIT_EPS, 20, 0.03)
		while True:
			frame = cv.QueryFrame(self.capture)
			# cv.Rectangle( frame, self.last_rect[0], self.last_rect[1], cv.CV_RGB(255,0,0), 3, cv.CV_AA, 0 )
			# cv.Smooth(frame, frame, cv.CV_GAUSSIAN, 15, 0)
			cv.Copy(frame, image)
			cv.CvtColor(image, grey, cv.CV_BGR2GRAY)
			if count == 0:
				eig = cv.CreateImage(cv.GetSize(grey), 32, 1)
				temp = cv.CreateImage(cv.GetSize(grey), 32, 1)
				quality = 0.01
				min_distance = 10
				points = cv.GoodFeaturesToTrack(grey, eig, temp, MAX_COUNT, quality, min_distance, None, 3, 0, 0.04)
				points = cv.FindCornerSubPix(grey, points, win_size, (-1, -1), criteria)
			else:
				flags = 0
				points, status, track_error = cv.CalcOpticalFlowPyrLK(prev_grey, grey, prev_pyramid, pyramid, prev_points, win_size, 2, criteria, flags)
				diff_points = []
				for i, j in enumerate(points):
					print j
					if not j == prev_points[i]:
						diff_points.append(j)
		       		print 'len %d' % len(diff_points)

			prev_points == points
			count = len(points)
			print count

			prev_grey = grey
			prev_pyramid = pyramid
			prev_points = points
			if line_draw:
				cv.Canny(grey, edges, 30, 150, 3)
				if line_draw == 1:
					cv.CvtColor(edges, image, cv.CV_GRAY2BGR)
				elif line_draw > 1:
					cv.Merge(edges, prev_grey2, prev_grey3, None, image)
					cv.Copy(prev_grey2, prev_grey3, None)
					cv.Copy(edges, prev_grey2, None)
			cv.ShowImage("Target", image)
			# Listen for ESC key
			c = cv.WaitKey(7) % 0x100
			if c == 27:
				break

if __name__=="__main__":
	t = Target()
	t.run()

