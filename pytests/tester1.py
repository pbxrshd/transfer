#!/usr/bin/python

import cv2

class Target:

    def __init__(self):
        self.camera = cv2.VideoCapture(0)
        if not self.camera:
            print "Error opening capture device"
            sys.exit(1)        

    def run(self):
        while True:
            f,img = self.camera.read();
            img = cv2.resize(img, (img.shape[1]/2, img.shape[0]/2))
            #img = cv2.threshold(img, 30, 255, cv2.THRESH_BINARY_INV)[1]
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            img = cv2.equalizeHist(img)            
            img = cv2.GaussianBlur(img,(0,0),5)
            
            cv2.putText(img,'filledImage',(20,20), cv2.FONT_HERSHEY_PLAIN, 1.0,255)
            cv2.imshow("webcam",img)
            #cv2.imwrite("image1.jpg", img, (cv2.cv.CV_IMWRITE_JPEG_QUALITY,24))
            # read user keyboard for 5ms, and break on ESC or ENTER key
            c = cv2.waitKey(5) % 0x100
            if c == 27 or c == 10:
               break        
        cv2.destroyAllWindows()


if __name__=="__main__":
    t = Target()
    t.run()
