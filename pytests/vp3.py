#!/usr/bin/python

import cv2


camera =  cv2.VideoCapture(0)
while True:
    f,img = camera.read();
    img = cv2.threshold(img, 30, 255, cv2.THRESH_BINARY_INV)[1]
    cv2.imshow("webcam",img)
    cv2.imwrite("image1.jpg", img, (cv2.cv.CV_IMWRITE_JPEG_QUALITY,24))
    # read user keyboard for 5ms, and break on any keypress.    
    if (cv2.waitKey (5) != -1):
        break;
