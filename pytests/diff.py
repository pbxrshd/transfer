#!/usr/bin/env python

CAMERAID=-2 # -1 for auto, -2 for video
HAARCASCADE="/usr/local/share/OpenCV/haarcascades/haarcascade_eye.xml"
STORE=False # write output video?

# Internal parameters
THRESH = 10 # starting treshhold
ERODE = 6 
DIALATE = 11
FPS = 25 # target FPS
HUEBINS = 30 # how many bins for hue histogram
SATBINS = 32 # how many bins for saturation histogram
XWINDOWS = 2 # how many windows on x axis
WORKING_HEIGHT = 300 # size of image to work with, 300 is okay

import cv
import time
import sys
import math

class Source:
    def __init__(self, id, flip=True):
        self.flip = flip
        self.capture = cv.CaptureFromCAM(0)

    def print_info(self):
        for prop in [ cv.CV_CAP_PROP_POS_MSEC, cv.CV_CAP_PROP_POS_FRAMES,
                cv.CV_CAP_PROP_POS_AVI_RATIO, cv.CV_CAP_PROP_FRAME_WIDTH,
                cv.CV_CAP_PROP_FRAME_HEIGHT, cv.CV_CAP_PROP_FPS,
                cv.CV_CAP_PROP_FOURCC, cv.CV_CAP_PROP_BRIGHTNESS,
                cv.CV_CAP_PROP_CONTRAST, cv.CV_CAP_PROP_SATURATION,
                cv.CV_CAP_PROP_HUE]:
            print cv.GetCaptureProperty(self.capture, prop)

    def grab_frame(self):
        self.frame = cv.QueryFrame(self.capture)
        if not self.frame:
            print "can't grap frame, or end of movie. Bye bye."
            sys.exit(2)
        if self.flip:
            cv.Flip(self.frame, None, 1)
        return self.frame
 

class GetHands:
    def __init__(self):
        self.source = Source(CAMERAID)
        self.threshold_value = THRESH
        self.erode_value = ERODE
        self.dialate_value = DIALATE
        self.count = -1
        self.ms = cv.CreateMemStorage()

        self.orig = self.source.grab_frame()

        self.width = self.orig.width
        self.height = self.orig.height
        self.size = (self.width, self.height)
        self.smallheight = WORKING_HEIGHT
        self.smallwidth = int(self.width * self.smallheight/self.height * 1.0)
        self.smallsize = (self.smallwidth, self.smallheight)

        # alloc mem for images
        self.small = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 3)
        self.visualize = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 3)
        self.bw = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 1)
        self.grey = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 1)
        self.smooth = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 1)
        self.first = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 1)
        self.prev = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 1)
        self.fuzz = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 1)
        self.diff1 = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 1)
        self.diff2 = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 1)
        self.temp = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 3)
        self.result = cv.CreateImage(self.smallsize, cv.IPL_DEPTH_8U, 3)

        # make matrix for erode/dilate
        MORPH_SIZE = 3
        center = (MORPH_SIZE / 2) + 1
        self.morpher_small = cv.CreateStructuringElementEx(MORPH_SIZE, MORPH_SIZE, center, center, cv.CV_SHAPE_ELLIPSE)
        MORPH_SIZE = 11
        center = (MORPH_SIZE / 2) + 1
        self.morpher = cv.CreateStructuringElementEx(MORPH_SIZE, MORPH_SIZE, center, center, cv.CV_SHAPE_ELLIPSE)

        # alloc mem for feature histogram
        self.feature_hist = cv.CreateHist([HUEBINS, SATBINS], cv.CV_HIST_ARRAY,
            [[0, 180], [0, 255]], 1)

        # alloc mem for background histogram
        self.bg_hist = cv.CreateHist([HUEBINS, SATBINS], cv.CV_HIST_ARRAY,
            [[0, 180], [0, 255]], 1)

        # video writer
        if STORE:
            self.writer = cv.CreateVideoWriter(OUTPUT,
                cv.CV_FOURCC('M','J','P','G'), 15, cv.GetSize(self.combined),
                is_color=1)
        # make window
        cv.NamedWindow("Skin Detection") 
        cv.CreateTrackbar('Threshold', 'Skin Detection', self.threshold_value,
                          100, self.change_threshold)

        cv.CreateTrackbar('Erode', 'Skin Detection', self.erode_value,
                          40, self.change_threshold)

        cv.CreateTrackbar('Dialate', 'Skin Detection', self.dialate_value,
                          40, self.change_threshold)

        cv.SetMouseCallback("Skin Detection", self.on_mouse)
        self.drag_start = None      # Set to (x,y) when mouse starts drag
        self.track_window = None    # Set to rect when the mouse drag finishes
     
        # cv.NamedWindow( "Histogram", 1 )

    def on_mouse(self, event, x, y, flags, param):
        if event == cv.CV_EVENT_LBUTTONDOWN:
            self.drag_start = (x, y)
        if event == cv.CV_EVENT_LBUTTONUP:
            self.drag_start = None
            self.track_window = self.selection
        if self.drag_start:
            xmin = min(x, self.drag_start[0])
            ymin = min(y, self.drag_start[1])
            xmax = max(x, self.drag_start[0])
            ymax = max(y, self.drag_start[1])
            self.selection = (xmin, ymin, xmax - xmin, ymax - ymin)

    def change_threshold(self, position):
        self.threshold_value = position

    def change_erode(self, position):
        self.erode_value = position

    def change_dialate(self, position):
        self.dialate_value = position

    def backproject(self):
        """ do a backprojection of feature histogram on full image """
        cv.CalcArrBackProject([self.hue, self.sat], self.bp, self.feature_hist)
        return self.bp

    def combine_images(self, images):
        """ render a list of images into one opencv frame """
        comb_width = self.smallwidth * XWINDOWS
        comb_height = self.smallheight * int(math.ceil(len(images) / float(XWINDOWS)))
        self.combined = cv.CreateImage((comb_width, comb_height), cv.IPL_DEPTH_8U, 3)

        font = cv.InitFont(cv.CV_FONT_HERSHEY_SIMPLEX, 0.3, 0.3)

        for i,(image, name) in enumerate(images):
            if image.nChannels == 1:
                cv.Merge(image, image, image, None, self.temp)
            else:
                cv.Copy(image, self.temp)
            xoffset = (i % XWINDOWS) * self.smallsize[0]
            yoffset = (i / XWINDOWS) * self.smallsize[1]
            cv.SetImageROI(self.combined, (xoffset, yoffset, self.smallsize[0],
                self.smallsize[1]))
            cv.Copy(self.temp, self.combined)
            cv.PutText(self.combined, name, (5, 10), font, (30, 200, 200))
            cv.ResetImageROI(self.combined)
        return self.combined

    def fuzz_image(self, image):

        cv.Smooth(image, self.fuzz, smoothtype=cv.CV_GAUSSIAN, param1=23, param2=23)
        # cv.Threshold(self.fuzz, self.fuzz, self.threshold_value, 255, cv.CV_THRESH_BINARY)
        cv.Erode(self.fuzz, self.fuzz, None, self.erode_value)
        cv.Dilate(self.fuzz, self.fuzz, None, self.dialate_value)

        return self.fuzz

    def pipeline(self):

        # recreating: 
        # http://www.youtube.com/watch?v=KREoXEy9ojY

        presentation = []
        self.orig = self.source.grab_frame()
        cv.Resize(self.orig, self.small)

        cv.Copy(self.small, self.visualize)
        cv.CvtColor(self.small, self.grey, cv.CV_BGR2GRAY)
        presentation.append((self.grey, 'grey'))

        if self.first_frame:
            self.count = 0
            cv.Copy(self.grey, self.first)

            cv.Smooth(self.first, self.first, smoothtype=cv.CV_GAUSSIAN, param1=23, param2=23)
            # cv.Threshold(self.first, self.first, self.threshold_value, 255, cv.CV_THRESH_BINARY)
            cv.Erode(self.first, self.first, None, self.erode_value)
            cv.Dilate(self.first, self.first, None, self.dialate_value)

            self.first = self.fuzz_image(self.first)
            self.first_frame = False
            print "capture"

        presentation.append((self.first, 'first')) # keep outside of if block

        self.smooth = cv.CloneImage(self.grey)
        cv.Smooth(self.smooth, self.smooth, smoothtype=cv.CV_GAUSSIAN, param1=23, param2=23)
        # cv.Threshold(self.smooth, self.smooth, self.threshold_value, 255, cv.CV_THRESH_BINARY)
        cv.Erode(self.smooth, self.smooth, None, self.erode_value)
        cv.Dilate(self.smooth, self.smooth, None, self.dialate_value)

        presentation.append((self.smooth, 'smooth'))
 
        cv.AbsDiff(self.smooth, self.first, self.diff2)

        x = cv.CountNonZero(self.diff2)
        if x == 0:
            self.count = self.count + 1

        font = cv.InitFont(cv.CV_FONT_HERSHEY_SIMPLEX, 0.3, 0.3)
        cv.PutText(self.diff2, str(self.count), (5, 30), font, (200, 200, 200))
        cv.PutText(self.diff2, str(x), (5, 60), font, (200, 200, 200))

        presentation.append((self.diff2, 'diff2'))

        # combine and show the results
        combined = self.combine_images(presentation)

        cv.ShowImage('Difference thing', combined )

        if STORE:
            cv.WriteFrame(self.writer, self.combined)

    def run(self):
        self.first_frame = True
        while True:
            t = time.time()
            self.pipeline()
            wait = max(2, (1000/FPS)-int((time.time()-t)*1000))
            cv.WaitKey(wait)


if __name__ == '__main__':
    g = GetHands()
    g.run()




