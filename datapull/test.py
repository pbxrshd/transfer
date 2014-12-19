#!/usr/bin/python

import re

str = """
  <div class="userContentWrapper">
    <div class="_wk">
      <span data-ft="&#123;&quot;tn&quot;:&quot;K&quot;&#125;" class="userContent">
        Please keep the Pakistan school shooting victims and thier <br /> families <br> in your <br/>duas. <span class="text_exposed_hide">...</span> May Allah(swt) ... protection.
      </span>
      <span abcdef>
        <a href="https://www.facebook.com/l.php?u=https%3A%2F%2Fwww.mediafire.com%2F%3F7mb2o8kw7nsqhpq&amp;h=OAQFjF0pc&amp1" 
          rel="nofollow nofollow" target="_blank" 
          onmouseover="LinkshimAsyncLink.swap(this, &quot;https:\\/\\/www.mediafire.com\\/?7mb2o8kw7nsqhpq&quot;);" 
          onclick="LinkshimAsyncLink.swap(this, &quot;https:\\/\\/www.faceboqhpq&a">
          <span>https://www.mediafire.com/</span>
          <wbr />
          <span class="word_break"></span>?7mb2o8kw7nsqhpq
        </a></span>      
      <span class="text_exposed_hide">...</span>
    </div>
  </div>
"""
print str
# remove span tags with content = "..."
str = re.sub(r'<span.*>\.\.\.</span>', "", str)
# remove all span tags, leaving only text content
str = re.sub(r'<span.*?>', "", str)
str = re.sub(r'</span>', "", str)
# remove all div tags, leaving only text content
str = re.sub(r'<div.*?>', "", str)
str = re.sub(r'</div>', "", str)

print str

print 'done'
