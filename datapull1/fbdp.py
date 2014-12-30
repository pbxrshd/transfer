#!/usr/bin/python
import os

import json
from HTMLParser import HTMLParser
#from lxml import html
#from lxml.etree import tostring
import urllib2
#import re

class FacebookDataParser(HTMLParser):
    def __init__(self, fb_page_url):
        HTMLParser.__init__(self)
        self.comments = []
        opener = urllib2.build_opener(urllib2.HTTPHandler(debuglevel=1))
        opener.addheaders = [('User-agent', 'Mozilla/5.0')]
        response = opener.open(fb_page_url)
        self.feed(response.read())
    def handle_comment(self, data):
        self.comments.append(data)
    def get_data(self):
        return {"data":'\n'.join(self.comments)}


def application(environ, start_response):
    ctype = 'text/plain'
    path = environ['PATH_INFO']
    if path == '/health':
        response_body = "1"
    elif path == '/env':
        response_body = ['%s: %s' % (key, value)
                    for key, value in sorted(environ.items())]
        response_body = '\n'.join(response_body)
    elif path == '/fbdata':
      query_params = urllib2.urlparse.parse_qs(environ['QUERY_STRING'])
      content = ""
      if query_params.has_key("callback"):
          callback_function_name = query_params["callback"][0]
          if callback_function_name:
              parser = FacebookDataParser("https://www.facebook.com/pages/Alhuda-Youth-Program/1471242616483881")
              data = parser.get_data()
              content = callback_function_name + "(" + json.dumps(data) + ");"
      ctype = 'application/json'
      response_body = content    
    else:
        ctype = 'text/html'
        response_body = '''<!doctype html><html lang="en"><head><meta charset="utf-8"></head><body>python application on OpenShift</body></html>'''

    status = '200 OK'
    response_headers = [('Content-Type', ctype), ('Content-Length', str(len(response_body)))]
    #
    start_response(status, response_headers)
    return [response_body]

#
# Below for testing only
#
if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    httpd = make_server('localhost', 60195, application)
    # Wait for a single request, serve it and quit.
    httpd.serve_forever()
