let loadedCount = 0;
let failedCount = 0;
let progressElem;
let searchResults = [];
// run after page load
(async function () {
  chrome.storage.local.get('enabled', function(data) {
    if(data.enabled) {
      createPluginStyles()
      processResults()
      initObserver()
    }
  });

  initPromo()

})();


/**
 * PROCESS RESULTS ON THE PAGE
 */
function processResults(){

  progressElem = createProgressElement()

  /**
   * GET RESULTS
   */
  searchResults = [].filter.call(document.querySelectorAll('.search-page__result:not(.ls5)'),
      function(elem) {
        return Number(elem.getAttribute('data-image-count')) > 0;
      })

  if (!searchResults) return


  /**
   * Listing image slider
   */

  // Loop results
  for (const productCard of searchResults) {
    createIframeGallery(productCard)
  }
}

/**
 * CREATE IFRAME GALLERY ON RESULT
 */
function createIframeGallery(productCard){
  // Get listing attributes
  const productId = productCard.getAttribute('data-advert-id')
  const listingStandout = productCard.querySelector('.listings-standout')

  if(listingStandout){
    productCard.classList.add('standout-fix')
  }


  /** iFrame **/
  const iframeWrapper = document.createElement('div');
  iframeWrapper.classList.add("lz-quick-view-wrapper")
  const galleryIframe = document.createElement('iframe');
  galleryIframe.classList.add('lz-quick-view-iframe')
  galleryIframe.src = "https://www.autotrader.co.uk/car-details/" + productId
  galleryIframe.setAttribute("scrolling", "no");
  iframeWrapper.appendChild(galleryIframe)
  productCard.appendChild(iframeWrapper)

  // Add custom CSS to disable clicking on thumbnail image and expanding gallery
  const iFrameStyleElement = document.createElement('style');
  iFrameStyleElement.textContent = `
          body{padding:0!important;}
          .slick-slide div[role="button"]{
            pointer-events: none;
            cursor: default;
          }
          #root .atds-header-wrapper,
          .slick-slide div[role="button"] > i,
          .slick-slider + section .atc-type-picanto{display:none!important;}
          section[data-gui^="gallery-"] .atc-type-smart{top: 26px;}
        `;

  // Add a load event listener to the iframe to crop the content
  galleryIframe.addEventListener("load", async function () {

    // Get the content window of the iframe
    const contentWindow = galleryIframe.contentWindow;

    // const galleryElemRegex = /^section\[data-gui="gallery-[a-z0-9]+-section"\]$/i;
    const regex = /^gallery-[a-z0-9]+-section$/i;
    const selector = `section[data-gui^="gallery-"][data-gui$="-section"]`;
    try {
      // Inject custom CSS
      contentWindow.document.head.appendChild(iFrameStyleElement)

      const iframeGallerySection = await waitForElement(contentWindow.document, selector, 42)

      // SET ROOT WRAPPER CONTENT TO GALLERY ONLY
      const mainWrapper = contentWindow.document.querySelector('div#root');
      mainWrapper.innerHTML = ""
      mainWrapper.appendChild(iframeGallerySection)

      // Show the iFrame
      galleryIframe.style.opacity = "1";
      iframeWrapper.classList.add("ready")

      handleCountUpdate(true)

    } catch (error) {
      console.log(error);
      handleCountUpdate(false)
    }

  });
}

/**
 * UPDATE PROGRESS
 */
function handleCountUpdate(success = true){
  if(success){
    loadedCount++
  } else {
    failedCount++
  }

  let msg = "Loading:"
  msg += " <span>" + loadedCount + " / " + searchResults.length + " listings</span>"

  progressElem.innerHTML = msg
  if(loadedCount >= searchResults.length){
    progressElem.style.background = "#08a09d"
    progressElem.innerHTML = "Compete ✓"
    progressElem.style.opacity = "0"
  } else if((failedCount + loadedCount) >= searchResults.length){
    progressElem.style.background = "#a06308"
    progressElem.innerHTML = "Partially compete ✓"
    progressElem.style.opacity = "0"
  }
}

/**
 * CREATE PROGRESS PILL
 */
function createProgressElement(){
  /**
   * Progress
   */
  const progressElem = document.createElement('div');
  progressElem.classList.add("lz-progress-wrapper")
  progressElem.innerHTML = "<span>Loading</span>"
  document.body.appendChild(progressElem)
  return progressElem
}

/**
 * PLUGIN STYLES
 */
function createPluginStyles(){
  // create style
  const styleElement = document.createElement('style');

  // set the CSS rules for the style element
  styleElement.textContent = `
      .lz-progress-wrapper{
        position:absolute;
        top: 1rem;
        right: 2rem;
        background: #4871d9;
        color: #fff;
        padding: 5px 12px;
        font-size:12px;
        border-radius: 4px;
        z-index:999;
        font-weight: 600;
        transition: opacity .3s;
        transition-delay: 1s;
        pointer-events: none;
      }
      
      .product-card{
        height:290px;
      }
      body {
        background-color: #f4f4f4;
      }
      .search-page__result{
        position:relative;
        height:290px;
      }

      .search-page__result[data-is-featured-listing] .lz-quick-view-wrapper{
        top: 18px;
      }
      
      .product-card-content{
        // padding-left:46%!important;
        // width:100%!important;
      }

      .lz-quick-view-wrapper{
        position:absolute;
        top: 0;
        left: 0;
        z-index: 2;
        width: 100%;
        max-width: 36%;
        height:100%;
        overflow: hidden;
     }
     .search-page__result.standout-fix .lz-quick-view-wrapper{
      top: 18px;
     }
     .lz-quick-view-wrapper.ready{
          border-color: #020406;
      }
      .lz-quick-view-iframe{
        width: 101%;
        height: 520px;
        overflow: hidden;
        position: absolute;
        top: -20px;
        left: -2px;
        transition: opacity 0.3s;
        opacity:0;
      }
     
      .lz-progress-wrapper{
        position:fixed;
        z-index: 99999;
        top: 2rem;
        right: 2rem;
        background: blue;
        color: #fff;
        padding: 2px 7px;
        border-radius: 3px;
      }
      
      @media (min-width: 1100px){
        .lz-quick-view-wrapper{
            max-width: 46%;
        }
      }
      
      .lz-promo-card{
        
      }
    `;

  document.head.appendChild(styleElement)
}

/**
 * OBSERVE RESULT CHANGES
 */
function initObserver(){
  // Get the element that you want to observe
  const targetNode = document.querySelector('.js-search-results');

// Create a new instance of the MutationObserver object
  const observer = new MutationObserver(function(mutationsList) {
    // Execute your own function when the contents of the target element change
    setTimeout(()=>{
      processResults();
    }, 300)
  });

// Define the options for the MutationObserver
  const config = { attributes: false, childList: true, subtree: false };

// Start observing the target element for changes
  observer.observe(targetNode, config);

}

/**
 * HELPER :: WAIT FOR ELEMENT
 */
function waitForElement(doc, selector, maxAttempts = 3) {
  let attempts = 0;
  return new Promise((resolve, reject) => {
    function checkElement() {
      attempts++;
      const element = doc.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (attempts >= maxAttempts) {
        reject(new Error(`Element not found after ${attempts} attempts`));
      } else {
        setTimeout(checkElement, 100);
      }
    }
    checkElement();
  });
}

/**
 * Promotional card
 */
function initPromo(){
  const sidebar = document.querySelector(".search-page__left")
  const searchForm = document.querySelector(".search-page__left .search-form")

  if(!searchForm) return

  const promoCard = document.createElement('div')
  promoCard.classList.add("lz-promo-card")

  // promoCard.innerHTML = "<h4>Looking for development services?</h4><p>I can help with technical web projects big and small.</p><p><a href='#' target='_blank'>Get in touch</a></p>"
  promoCard.innerHTML = `<div class="module module--vehicle-check">
    <div class="module__header">
        <p class="module__header-title" style="font-size: 175%;">Need a web developer?</p>
        <h2 class="module__label">I'm Jack, a full-stack software developer who built this plugin.</h2>
    </div>
    <div class="module__body module__header">
        <p style="">10+ yrs experience building things on the web such as:</p>
        <ul style="list-style: circle;margin: 10px 0 15px;padding-left: 10px;">
            <li style="list-style: circle;">Open source UX packages</li>
            <li style="list-style: circle;">Data processing & analysis tools</li>
            <li style="list-style: circle;">SPA's and web apps</li>
            <li style="list-style: circle;">Back end systems & authentication</li>
            <li style="list-style: circle;">Responsive e-commerce websites</li>    
        </ul>
    </div>
    <div class="module__button">
        <a href="https://github.com/sjmc11/" target="_blank" class="module__button-cta tracking-standard-link" style="background: #ecf1ff;color: #2865c3!important;border-color: #2865c3!important;">Get in touch</a>
    </div>
</div>`

  searchForm.insertAdjacentElement('afterend', promoCard)

}