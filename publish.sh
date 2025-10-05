echo "Commit Message : $1"
echo "Switching to local master branch"
git switch master
echo "staging all changes"
git add -A
echo "committing changes"
git commit -m "$1"
echo "pushing to remote main branch"
git push origin master:main
echo "Done!"