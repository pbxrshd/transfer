#!/usr/bin/python
import cv2
 
FACE_TRAINSET = "haarcascades/haarcascade_frontalface_default.xml"
DOWNSCALE = 4
 
webcam = cv2.VideoCapture(0)
cv2.namedWindow("preview")
classifier = cv2.CascadeClassifier(FACE_TRAINSET)

 
if webcam.isOpened(): # try to get the first frame
    rval, frame = webcam.read()
    #print frame.shape (480,640,3)
else:
    rval = False
 
while rval:
    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    minisize = (frame.shape[1]/DOWNSCALE,frame.shape[0]/DOWNSCALE)
    miniframe = cv2.resize(frame, (frame.shape[1]/DOWNSCALE,frame.shape[0]/DOWNSCALE))
    faces = classifier.detectMultiScale(miniframe, minSize=(40, 40), maxSize=(150, 150),
    flags=cv2.cv.CV_HAAR_DO_CANNY_PRUNING|cv2.cv.CV_HAAR_FIND_BIGGEST_OBJECT|cv2.cv.CV_HAAR_DO_ROUGH_SEARCH)
    
    for f in faces:
        x, y, w, h = [ v*DOWNSCALE for v in f]
        cv2.rectangle(frame, (x,y), (x+w,y+h), (128,128,128))      
    cv2.imshow("preview", frame)
 
    # get next frame
    rval, frame = webcam.read()
 
    key = cv2.waitKey(20)
    if key in [27, ord('Q'), ord('q')]: # exit on ESC
        break

webcam.release()
cv2.destroyAllWindows()
